/**
 * Converts yyyymmdd_hhmmss to Datetime string
 */
export function parseTimestamp(timestamp: string) {
  const year = parseInt(timestamp.slice(0, 4))
  const month = parseInt(timestamp.slice(4, 6)) - 1 // Months are zero-indexed
  const day = parseInt(timestamp.slice(6, 8))
  const hour = parseInt(timestamp.slice(9, 11))
  const minute = parseInt(timestamp.slice(11, 13))
  const second = parseInt(timestamp.slice(13, 15))

  const date = new Date(Date.UTC(year, month, day, hour, minute, second))
  return date.toISOString().replace('T', ' ')
}


export type ParsedFilename = {
  pan?: number
  tilt?: number
  zoom?: number
  label?: string
  confidence?: string
  datetime: string
  isDebug: boolean
  version: 'v1' | 'v2' | 'v3' | 'v4'
}

/**
 * Parses PTZ image filenames across different versions
 *
 * Supported formats:
 * v1: traffic_light_conf0.35_20250309_115225.jpg
 * v2: 294_15_4_support_hose_conf0.99_20251119_214038.jpg
 * v3: 336_1_1_house_conf0.74_20251122_203054.jpg OR debug_135_0_1_20251122_204023.jpg
 * v4: scan_000_000_01_window_conf0.98_20251213_235020.jpg OR scan_015_000_01_debug_20251213_235133.jpg
 */
export function parseFilename(filename: string): ParsedFilename {
  // Remove file extension
  const nameWithoutExt = filename.replace('.jpg', '')

  // Extract datetime (always last two parts: YYYYMMDD_HHMMSS)
  const parts = nameWithoutExt.split('_')
  const datetime = parts.slice(-2).join('_')

  // Check for v4 format (starts with 'scan_')
  if (filename.startsWith('scan_')) {
    const isDebug = parts.includes('debug')
    const pan = Number(parts[1])
    const tilt = Number(parts[2])
    const zoom = Number(parts[3])

    if (isDebug) {
      // scan_015_000_01_debug_20251213_235133.jpg
      return {
        pan,
        tilt,
        zoom,
        datetime,
        isDebug: true,
        version: 'v4'
      }
    } else {
      // scan_000_000_01_window_conf0.98_20251213_235020.jpg
      const confidencePart = parts.find(p => p.startsWith('conf'))
      const confidence = confidencePart?.replace('conf', '')
      const confIndex = parts.indexOf(confidencePart!)
      const label = parts.slice(4, confIndex).join('_')

      return {
        pan,
        tilt,
        zoom,
        label,
        confidence,
        datetime,
        isDebug: false,
        version: 'v4'
      }
    }
  }

  // Check for v3 debug format (starts with 'debug_')
  if (filename.startsWith('debug_')) {
    // debug_135_0_1_20251122_204023.jpg
    const [, pan, tilt, zoom] = parts
    return {
      pan: Number(pan),
      tilt: Number(tilt),
      zoom: Number(zoom),
      datetime,
      isDebug: true,
      version: 'v3'
    }
  }

  // Check if first part is numeric (v2 or v3 non-debug)
  const firstPartIsNumeric = /^\d+$/.test(parts[0])

  if (firstPartIsNumeric) {
    // v2 or v3: 294_15_4_support_hose_conf0.99_20251119_214038.jpg
    const [pan, tilt, zoom] = parts
    const confidencePart = parts.find(p => p.startsWith('conf'))
    const confidence = confidencePart?.replace('conf', '')
    const confIndex = parts.indexOf(confidencePart!)
    const label = parts.slice(3, confIndex).join('_')

    return {
      pan: Number(pan),
      tilt: Number(tilt),
      zoom: Number(zoom),
      label,
      confidence,
      datetime,
      isDebug: false,
      version: confIndex > 3 ? 'v2' : 'v3'
    }
  }

  // v1: traffic_light_conf0.35_20250309_115225.jpg
  const confidencePart = parts.find(p => p.startsWith('conf'))
  const confidence = confidencePart?.replace('conf', '')
  const confIndex = parts.indexOf(confidencePart!)
  const label = parts.slice(0, confIndex).join('_')

  return {
    label,
    confidence,
    datetime,
    isDebug: false,
    version: 'v1'
  }
}
