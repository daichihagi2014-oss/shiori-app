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
    if (m?.[1]) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  }
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

    const html = await res.text()

    const title = extractMeta(html, 'og:title')
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      ?? parsedUrl.hostname

    const description = extractMeta(html, 'og:description')
      ?? extractMeta(html, 'description')

    let image = extractMeta(html, 'og:image')
    // Make relative image URLs absolute
    if (image && !image.startsWith('http')) {
      image = new URL(image, parsedUrl.origin).href
    }

    const siteName = extractMeta(html, 'og:site_name') ?? parsedUrl.hostname

    return NextResponse.json({ title, description, image, siteName, url: parsedUrl.href })
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
