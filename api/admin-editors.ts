import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'node:http'

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function getSupabaseAdmin() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const expectedPin = (process.env.ADMIN_PIN || '').trim()
  if (!expectedPin) {
    sendJson(res, 503, {
      error: 'ADMIN_PIN belum diatur di Vercel Environment Variables.',
    })
    return
  }

  const providedPin = String(req.headers['x-admin-pin'] ?? '').trim()
  if (!providedPin || providedPin !== expectedPin) {
    sendJson(res, 401, { error: 'PIN Admin salah.' })
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    sendJson(res, 503, {
      error:
        'SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum tersedia di server.',
    })
    return
  }

  const method = (req.method ?? 'GET').toUpperCase()

  if (method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('friends')
      .select('name, can_edit, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      sendJson(res, 500, { error: error.message })
      return
    }
    sendJson(res, 200, { friends: data ?? [] })
    return
  }

  const body = await readJsonBody(req)
  const rawName =
    typeof body.name === 'string'
      ? body.name.trim().replace(/\s+/g, ' ').toLowerCase()
      : ''

  if (!rawName) {
    sendJson(res, 400, { error: 'Nama teman wajib diisi.' })
    return
  }

  if (method === 'POST') {
    const canEdit = typeof body.can_edit === 'boolean' ? body.can_edit : true
    const escaped = rawName.replace(/[%_\\]/g, '\\$&')
    const { data: existing } = await supabaseAdmin
      .from('friends')
      .select('name')
      .ilike('name', escaped)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('friends')
        .update({ can_edit: canEdit })
        .eq('name', existing.name)
        .select('name, can_edit, created_at')
        .single()
      if (error) {
        sendJson(res, 500, { error: error.message })
        return
      }
      sendJson(res, 200, { friend: data })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('friends')
      .insert({ name: rawName, can_edit: canEdit })
      .select('name, can_edit, created_at')
      .single()

    if (error) {
      sendJson(res, 500, { error: error.message })
      return
    }
    sendJson(res, 201, { friend: data })
    return
  }

  if (method === 'PATCH') {
    const canEdit = Boolean(body.can_edit)
    const { data, error } = await supabaseAdmin
      .from('friends')
      .update({ can_edit: canEdit })
      .eq('name', rawName)
      .select('name, can_edit, created_at')
      .single()

    if (error) {
      sendJson(res, 500, { error: error.message })
      return
    }
    sendJson(res, 200, { friend: data })
    return
  }

  if (method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('friends')
      .delete()
      .eq('name', rawName)

    if (error) {
      sendJson(res, 500, { error: error.message })
      return
    }
    sendJson(res, 200, { deleted: rawName })
    return
  }

  sendJson(res, 405, { error: 'Method tidak didukung.' })
}
