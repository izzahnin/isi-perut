export interface ParsedMapsLocation {
  lat: number | null
  lng: number | null
  mapsUrl: string | null
}

const COORD_PAIR = '(-?\\d{1,2}(?:\\.\\d+)?)[,\\s]+(-?\\d{1,3}(?:\\.\\d+)?)'

const PATTERNS: RegExp[] = [
  // !3dLAT!4dLNG (exact Google Maps place pin — highest priority)
  /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  // @lat,lng (standard Google Maps place/viewport URL)
  new RegExp(`@${COORD_PAIR}`),
  // ?q=lat,lng or &q=lat,lng or ?query=lat,lng
  new RegExp(`[?&](?:q|query)=${COORD_PAIR}`),
  // ?ll=lat,lng or &center=lat,lng
  new RegExp(`[?&](?:ll|center)=${COORD_PAIR}`),
  // Plain coordinate pair input: "-5.1342, 119.4067"
  new RegExp(`^\\s*${COORD_PAIR}\\s*$`),
]

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Extracts latitude, longitude, and normalized Google Maps URL from raw coordinates or a Maps URL.
 */
export function parseMapsInput(rawInput: string): ParsedMapsLocation {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return { lat: null, lng: null, mapsUrl: null }
  }

  let decoded = trimmed
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    // Keep original string if URI decoding fails
  }

  for (const pattern of PATTERNS) {
    const match = decoded.match(pattern)
    if (!match) continue

    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])
    if (isValidCoordinates(lat, lng)) {
      const isUrl = /^https?:\/\//i.test(trimmed)
      return {
        lat,
        lng,
        mapsUrl: isUrl
          ? trimmed
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }
    }
  }

  return {
    lat: null,
    lng: null,
    mapsUrl: /^https?:\/\//i.test(trimmed) ? trimmed : null,
  }
}

/**
 * Builds the best 1-tap Google Maps deep-link for a place.
 */
export function buildGoogleMapsUrl(params: {
  lat: number | null
  lng: number | null
  mapsUrl: string | null
  name: string
}): string {
  if (params.mapsUrl) {
    return params.mapsUrl
  }
  if (params.lat !== null && params.lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${params.lat},${params.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${params.name} Makassar`)}`
}
