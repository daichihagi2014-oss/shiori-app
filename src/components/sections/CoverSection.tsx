'use client'

import { useRef, useState } from 'react'
import { Camera, MapPin, Calendar, Loader2 } from 'lucide-react'
import { Itinerary } from '@/lib/types'
import { formatDateRange } from '@/lib/utils'
import { updateItinerary, uploadCoverImage } from '@/lib/db'

interface Props {
  itinerary: Itinerary
  onUpdate: (patch: Partial<Itinerary>) => void
}

export default function CoverSection({ itinerary, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { alert('15MB以下の画像を選択してください'); return }

    setUploading(true)
    const url = await uploadCoverImage(itinerary.id, file)
    setUploading(false)

    if (url) {
      await updateItinerary(itinerary.id, { cover_image_url: url })
      onUpdate({ cover_image_url: url })
    }
  }

  async function handleTitleBlur(e: React.FocusEvent<HTMLHeadingElement>) {
    const newTitle = e.currentTarget.textContent?.trim() || itinerary.title
    if (newTitle !== itinerary.title) {
      await updateItinerary(itinerary.id, { title: newTitle })
      onUpdate({ title: newTitle })
    }
  }

  async function handleDestinationBlur(e: React.FocusEvent<HTMLSpanElement>) {
    const newDest = e.currentTarget.textContent?.trim() || ''
    if (newDest !== itinerary.destination) {
      await updateItinerary(itinerary.id, { destination: newDest })
      onUpdate({ destination: newDest })
    }
  }

  async function handleDescriptionBlur(e: React.FocusEvent<HTMLParagraphElement>) {
    const newDesc = e.currentTarget.textContent?.trim() || ''
    if (newDesc !== itinerary.description) {
      await updateItinerary(itinerary.id, { description: newDesc })
      onUpdate({ description: newDesc })
    }
  }

  const hasCover = !!itinerary.cover_image_url

  return (
    <div className="animate-fade-in">
      {/* Cover image area */}
      <div
        className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden group cursor-pointer mb-6"
        style={{
          background: hasCover
            ? `url(${itinerary.cover_image_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        }}
        onClick={() => fileRef.current?.click()}
      >
        {/* Overlay */}
        <div className={`absolute inset-0 ${hasCover ? 'bg-black/30 group-hover:bg-black/40' : 'bg-white/5 group-hover:bg-white/10'} transition-colors flex flex-col items-center justify-center`}>
          {uploading ? (
            <Loader2 size={32} className="text-white animate-spin" />
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
              <Camera size={28} className="mx-auto mb-1" />
              <span className="text-sm font-medium">{hasCover ? '表紙画像を変更' : '表紙画像を追加'}</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {/* Title and meta */}
      <div className="px-1">
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          data-placeholder="旅のタイトルを入力..."
          className="text-2xl md:text-3xl font-bold text-stone-800 mb-3 focus:outline-none border-b-2 border-transparent focus:border-indigo-300 pb-1 transition-colors"
        >
          {itinerary.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-4">
          {(itinerary.start_date || itinerary.end_date) && (
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-indigo-400" />
              {formatDateRange(itinerary.start_date, itinerary.end_date)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-rose-400" />
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={handleDestinationBlur}
              data-placeholder="目的地を入力"
              className="focus:outline-none border-b border-transparent focus:border-indigo-300 min-w-[60px]"
            >
              {itinerary.destination || ''}
            </span>
          </span>
        </div>

        {(itinerary.description !== undefined) && (
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={handleDescriptionBlur}
            data-placeholder="旅のコンセプトや一言メモを入力..."
            className="text-stone-500 text-sm focus:outline-none border-b border-transparent focus:border-indigo-300 min-h-[24px] pb-1"
          >
            {itinerary.description || ''}
          </p>
        )}
      </div>
    </div>
  )
}
