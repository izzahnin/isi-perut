import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Resolves shortened Google Maps URLs (e.g. maps.app.goo.gl) on the server
 * to bypass browser CORS and expose the final URL containing @lat,lng / !3d!4d.
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse,
) {
  const urlObj = new URL(req.url ?? '/', 'http://localhost')
  const rawUrl = urlObj.searchParams.get('url')?.trim() ?? ''

  if (
    !rawUrl ||
    !/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(rawUrl)
  ) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid Google Maps short link' }))
    return
  }

  try {
    const response = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'IsiPerutMakassarPWA/1.0',
      },
    })
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ resolvedUrl: response.url }))
  } catch {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Failed to resolve short link' }))
  }
}
