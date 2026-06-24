import { NextRequest, NextResponse } from 'next/server'

function extractMeta(html: string, prop: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop.replace('og:', 'twitter:')}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop.replace('og:', 'twitter:')}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }
  return null
}

function isGoogleMapsUrl(url: URL): boolean {
  return /maps\.(google|app\.goo)\.gl|google\.[^/]+\/maps|goo\.gl\/maps/.test(url.hostname + url.pathname)
}

function extractPlaceFromMapsUrl(url: URL): string | null {
  // /maps/place/PLACE_NAME/@...
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/@?]+)/)
  if (placeMatch?.[1]) {
    const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
    if (name && name !== 'place') return name
  }
  // ?q=QUERY or ?query=QUERY
  const q = url.searchParams.get('q') ?? url.searchParams.get('query')
  if (q) return decodeURIComponent(q.replace(/\+/g, ' '))
  return null
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url')
  if (!rawUrl) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol')
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }

  // Google Maps: extract place name from URL without fetching (JS-rendered page)
  if (isGoogleMapsUrl(parsedUrl)) {
    const placeName = extractPlaceFromMapsUrl(parsedUrl)
    return NextResponse.json({
      title: placeName ?? 'Google Maps',
      description: '地図を開く',
      image: null,
      siteName: 'Google Maps',
      url: parsedUrl.href,
    })
  }

  try {
    const res = await fetch(parsedUrl.href, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      redirect: 'follow',
    })

    // After redirect, if it ended up on a Google Maps page
    const finalUrl = new URL(res.url)
    if (isGoogleMapsUrl(finalUrl)) {
      const placeName = extractPlaceFromMapsUrl(finalUrl)
      return NextResponse.json({
        title: placeName ?? 'Google Maps',
        description: '地図を開く',
        image: null,
        siteName: 'Google Maps',
        url: res.url,
      })
    }

    const html = await res.text()

    let title = extractMeta(html, 'og:title')
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      ?? parsedUrl.hostname

    // Strip common site-name suffixes from title (e.g. "Restaurant Name | Tabelog")
    // but keep as-is for now

    const description = extractMeta(html, 'og:description')
      ?? extractMeta(html, 'description')

    let image = extractMeta(html, 'og:image')
    if (image && !image.startsWith('http')) {
      image = new URL(image, parsedUrl.origin).href
    }

    const siteName = extractMeta(html, 'og:site_name') ?? parsedUrl.hostname

    return NextResponse.json({ title, description, image, siteName, url: finalUrl.href })
  } catch {
    return NextResponse.json({
      title: parsedUrl.hostname,
      description: null,
      image: null,
      siteName: parsedUrl.hostname,
      url: parsedUrl.href,
    })
  }
}
