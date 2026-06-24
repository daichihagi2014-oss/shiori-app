'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ExternalLink, MapPin, ChevronDown, ChevronUp, Loader2, Link2 } from 'lucide-react'
import { Section, Item } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'

interface PlaceMeta {
  url?: string
  og_title?: string
  og_description?: string
  og_image?: string
  og_site?: string
  note?: string
  fetched?: boolean
}

interface OgData {
  title?: string | null
  description?: string | null
  image?: string | null
  siteName?: string | null
  url?: string
  error?: string
}

interface Props {
  section: Section
  onUpdate: (section: Section) => void
}

async function fetchOg(url: string): Promise<OgData> {
  try {
    const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
    return await res.json()
  } catch {
    return { error: 'fetch failed' }
  }
}

function isGoogleMapsUrl(url: string) {
  return /maps\.google\.|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/.test(url)
}

function PlaceCard({ item, onSave, onDelete }: {
  item: Item
  onSave: (patch: Partial<Item>) => void
  onDelete: () => void
}) {
  const meta = item.metadata as PlaceMeta
  const [urlInput, setUrlInput] = useState(meta.url ?? '')
  const [note, setNote] = useState(meta.note ?? '')
  const [loading, setLoading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const hasPreview = meta.fetched && (meta.og_title || meta.og_image)
  const displayTitle = meta.og_title || item.content || meta.url || '場所を追加'

  async function handleUrlBlur() {
    const url = urlInput.trim()
    if (!url || url === meta.url) return
    if (!url.startsWith('http')) { setUrlInput(meta.url ?? ''); return }

    setLoading(true)
    const og = await fetchOg(url)
    const patch: Partial<Item> = {
      content: og.title ?? url,
      metadata: {
        ...meta,
        url,
        og_title: og.title ?? undefined,
        og_description: og.description ?? undefined,
        og_image: og.image ?? undefined,
        og_site: og.siteName ?? undefined,
        fetched: true,
      } as Record<string, unknown>,
    }
    onSave(patch)
    setLoading(false)
  }

  function saveNote() {
    if (note === meta.note) return
    onSave({ metadata: { ...meta, note } as Record<string, unknown> })
  }

  return (
    <div className="group rounded-2xl overflow-hidden animate-slide-in" style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--separator-opaque)',
      boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* OGP image */}
      {meta.og_image && !imgError && (
        <div className="relative w-full" style={{ aspectRatio: '2/1', maxHeight: '140px' }}>
          <img
            src={meta.og_image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {meta.url && (
            <a
              href={meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'white' }}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      <div className="px-3 py-3 space-y-2">
        {/* Site name */}
        {meta.og_site && meta.og_site !== meta.og_title && (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--label-tertiary)' }}>
            <Link2 size={10} />
            {meta.og_site}
            {isGoogleMapsUrl(meta.url ?? '') && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
                Google Maps
              </span>
            )}
          </div>
        )}

        {/* Title / URL input */}
        {hasPreview ? (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--label)' }}>{displayTitle}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {meta.url && !meta.og_image && (
                <a href={meta.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>
                  <ExternalLink size={13} />
                </a>
              )}
              <button onClick={onDelete} className="opacity-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity" style={{ color: 'var(--label-quaternary)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MapPin size={12} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Google Maps URL を貼り付け"
              className="flex-1 text-sm focus:outline-none bg-transparent"
              style={{ color: 'var(--label-secondary)' }}
            />
            {loading && <Loader2 size={13} className="animate-spin shrink-0" style={{ color: 'var(--blue)' }} />}
            <button onClick={onDelete} className="opacity-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--label-quaternary)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* OGP description */}
        {meta.og_description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--label-tertiary)' }}>
            {meta.og_description}
          </p>
        )}

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="メモを追加..."
          className="w-full text-xs focus:outline-none bg-transparent"
          style={{ color: 'var(--label-tertiary)', borderTop: hasPreview ? '1px solid var(--separator-opaque)' : 'none', paddingTop: hasPreview ? '8px' : 0 }}
        />

        {/* URL link row (when image is shown and no link button in image) */}
        {hasPreview && meta.url && meta.og_image && !imgError && (
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--blue)' }}
          >
            <ExternalLink size={11} />
            {isGoogleMapsUrl(meta.url) ? 'Google Maps で開く' : '開く'}
          </a>
        )}
      </div>
    </div>
  )
}

export default function PlacesSection({ section, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function addPlace() {
    const newItem = await addItem(section.id, '', section.items.length, {} as Record<string, unknown>)
    if (newItem) {
      onUpdate({ ...section, items: [...section.items, newItem] })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleItemSave(itemId: string, patch: Partial<Item>) {
    await updateItem(itemId, patch)
    onUpdate({ ...section, items: section.items.map(i => i.id === itemId ? { ...i, ...patch } : i) })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter(i => i.id !== itemId) })
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 flex items-center gap-2" style={{ color: 'var(--label)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(255,45,85,0.12)' }}>
            📌
          </span>
          {section.title}
          {section.items.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--red)' }}>
              {section.items.length}件
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-2.5">
          {section.items.length === 0 && (
            <div className="text-center py-10 rounded-2xl" style={{ color: 'var(--label-tertiary)', border: '1.5px dashed var(--separator-opaque)' }}>
              <MapPin size={28} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">行きたい場所を追加しましょう</p>
              <p className="text-xs mt-1 opacity-70">Google Maps URLを貼るだけでプレビュー表示</p>
            </div>
          )}

          {section.items.map(item => (
            <PlaceCard
              key={item.id}
              item={item}
              onSave={patch => handleItemSave(item.id, patch)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}

          <button
            onClick={addPlace}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl w-full justify-center"
            style={{ border: '1.5px dashed rgba(255,45,85,0.35)', color: 'var(--red)' }}
          >
            <Plus size={15} /> 候補地を追加
          </button>
        </div>
      )}
    </div>
  )
}
