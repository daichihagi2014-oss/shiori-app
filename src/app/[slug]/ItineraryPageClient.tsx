'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Itinerary } from '@/lib/types'
import { getItinerary } from '@/lib/db'
import PasswordGate from '@/components/PasswordGate'
import ItineraryEditor from '@/components/ItineraryEditor'

interface Props {
  slug: string
}

export default function ItineraryPageClient({ slug }: Props) {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(`shiori_auth_${slug}`)
    if (stored === 'true') setAuthed(true)

    getItinerary(slug).then((data) => {
      if (!data) setNotFound(true)
      else setItinerary(data)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-pulse">🗺️</div>
          <div className="text-stone-400 text-sm">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">しおりが見つかりませんでした</h1>
          <p className="text-stone-500 text-sm mb-6">URLが間違っているか、しおりが削除された可能性があります</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            トップへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <PasswordGate
        slug={slug}
        title={itinerary?.title}
        onSuccess={() => setAuthed(true)}
      />
    )
  }

  if (!itinerary) return null

  return <ItineraryEditor itinerary={itinerary} slug={slug} />
}
