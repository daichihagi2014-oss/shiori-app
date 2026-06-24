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
    if (m?.[1]) return m[1]
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }
  return null
}

function isGoogleMapsHost(url: URL): boolean {
  return /^(maps\.app\.goo\.gl|goo\.gl|maps\.google\.[a-z.]+|www\.google\.[a-z.]+)$/.test(url.hostname)
}

function isShortMapsUrl(url: URL): boolean {
  return /^(maps\.app\.goo\.gl|goo\.gl)$/.test(url.hostname)
}

// Extract place name from a full Google Maps URL path
function extractPlaceFromMapsUrl(url: URL): string | null {
  try {
    // /maps/place/PLACE_NAME/@... or /maps/place/PLACE_NAME/data=...
    const m = url.pathname.match(/\/maps\/place\/([^/@?]+)/)
    if (m?.[1]) {
      const name = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim()
      if (name && name.length > 1) return name
    }
    // ?q= or ?query=
    const q = url.searchParams.get('q') ?? url.searchParams.get('query')
    if (q) return decodeURIComponent(q.replace(/\+/g, ' ')).trim()
  } catch { /* ignore */ }
  return null
}

// Strip " - Google Maps" / " - Google マップ" suffix from HTML title
function cleanMapsTitle(title: string): string {
  return title.replace(/\s*[-–—|]\s*Google (Maps|マップ)\s*$/i, '').trim()
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

  // For full Google Maps URLs (not short links), try to extract place name directly
  if (isGoogleMapsHost(parsedUrl) && !isShortMapsUrl(parsedUrl)) {
    const placeName = extractPlaceFromMapsUrl(parsedUrl)
    if (placeName) {
      return NextResponse.json({ title: placeName, description: 'Google マップで見る', image: null, siteName: 'Google Maps', url: parsedUrl.href })
    }
  }

  try {
    const res = await fetch(parsedUrl.href, {
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })

    const finalUrl = new URL(res.url)

    // After following redirects, check if we landed on a Google Maps page
    if (isGoogleMapsHost(finalUrl)) {
      // Try extracting place name from the final URL
      const placeName = extractPlaceFromMapsUrl(finalUrl)
      if (placeName) {
        return NextResponse.json({ title: placeName, description: 'Google マップで見る', image: null, siteName: 'Google Maps', url: res.url })
      }

      // Fallback: parse the HTML title tag (may say "PLACE - Google マップ")
      const html = await res.text()
      const rawTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      const title = rawTitle ? cleanMapsTitle(rawTitle) : null
      return NextResponse.json({
        title: title && title !== 'Google Maps' && title !== 'Google マップ' ? title : 'Google Maps',
        description: 'Google マップで見る',
        image: null,
        siteName: 'Google Maps',
        url: res.url,
      })
    }

    // Non-Google URL: parse OGP
    const html = await res.text()
    const title = extractMeta(html, 'og:title')
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      ?? parsedUrl.hostname

    const description = extractMeta(html, 'og:description') ?? extractMeta(html, 'description')
    let image = extractMeta(html, 'og:image')
    if (image && !image.startsWith('http')) image = new URL(image, parsedUrl.origin).href
    const siteName = extractMeta(html, 'og:site_name') ?? finalUrl.hostname

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
