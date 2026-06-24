'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Clock, MapPin, ChevronDown, ChevronUp, Camera, Loader2, GripVertical, Banknote } from 'lucide-react'
import { Section, Item, ScheduleItemMetadata } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { formatDateShort, addDays } from '@/lib/utils'

const EMOJIS = ['📍','🍽️','🚗','🚄','✈️','🏨','⛩️','🏖️','🎡','🛍️','☕','🌸','🏔️','🎭','🎵','🚢','🎿','🏯','🌺','🦁']
const EXPENSE_CATEGORIES = ['食費', '交通費', '宿泊費', '観光', 'お土産', '娯楽', 'その他']

interface Props {
  section: Section
  startDate?: string | null
  onUpdate: (section: Section) => void
}

export default function ScheduleSection({ section, startDate, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  async function addScheduleItem() {
    const meta: ScheduleItemMetadata = {
      date: startDate ? addDays(startDate, 0) : '',
      time: '',
      location: '',
      note: '',
      emoji: '📍',
      photo_url: '',
    }
    const newItem = await addItem(section.id, '', section.items.length, meta as Record<string, unknown>)
    if (newItem) onUpdate({ ...section, items: [...section.items, newItem] })
  }

  async function handleItemUpdate(itemId: string, patch: Partial<Item>) {
    await updateItem(itemId, patch)
    onUpdate({ ...section, items: section.items.map(i => i.id === itemId ? { ...i, ...patch } : i) })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter(i => i.id !== itemId) })
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggedId) setDragOverId(id)
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return }

    const items = [...section.items]
    const fromIdx = items.findIndex(i => i.id === draggedId)
    const toIdx = items.findIndex(i => i.id === targetId)
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)

    const updated = items.map((item, idx) => ({ ...item, position: idx }))
    onUpdate({ ...section, items: updated })

    // Persist positions (fire-and-forget, no await needed for UX)
    updated.forEach(item => updateItem(item.id, { position: item.position }))

    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 text-black flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(0,122,255,0.12)' }}>📅</span>
          {section.title}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {section.items.length === 0 && (
            <div className="text-center py-8 rounded-2xl text-sm" style={{ color: 'var(--label-tertiary)', border: '1.5px dashed var(--separator-opaque)' }}>
              スケジュールを追加しましょう
            </div>
          )}

          {section.items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, item.id)}
              onDragOver={e => handleDragOver(e, item.id)}
              onDrop={e => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: draggedId === item.id ? 0.4 : 1,
                outline: dragOverId === item.id && draggedId !== item.id ? '2px solid var(--blue)' : 'none',
                borderRadius: '16px',
                transition: 'opacity 0.15s',
              }}
            >
              <ScheduleItem
                item={item}
                prevDate={idx > 0 ? (section.items[idx - 1].metadata as ScheduleItemMetadata).date : undefined}
                onUpdate={(patch) => handleItemUpdate(item.id, patch)}
                onDelete={() => handleDelete(item.id)}
                startDate={startDate}
                sectionId={section.id}
              />
            </div>
          ))}

          <button
            onClick={addScheduleItem}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl w-full justify-center transition-colors"
            style={{ border: '1.5px dashed rgba(0,122,255,0.35)', color: 'var(--blue)' }}
          >
            <Plus size={15} /> スケジュールを追加
          </button>
        </div>
      )}
    </div>
  )
}

function ScheduleItem({ item, prevDate, onUpdate, onDelete, startDate, sectionId }: {
  item: Item
  prevDate?: string
  onUpdate: (patch: Partial<Item>) => void
  onDelete: () => void
  startDate?: string | null
  sectionId: string
}) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const meta = item.metadata as ScheduleItemMetadata
  const showDivider = meta.date && meta.date !== prevDate

  function updateMeta(key: keyof ScheduleItemMetadata, value: string | number) {
    const parsed = key === 'amount' ? (value === '' ? undefined : Number(value)) : value
    onUpdate({ metadata: { ...meta, [key]: parsed } as Record<string, unknown> })
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { alert('15MB以下の画像を選択してください'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `schedule/${sectionId}_${item.id}.${ext}`
    const { error } = await supabase.storage.from('shiori-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('shiori-images').getPublicUrl(path)
      updateMeta('photo_url', data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="animate-slide-in">
      {showDivider && meta.date && (
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px" style={{ background: 'var(--separator-opaque)' }} />
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}>
            {formatDateShort(meta.date)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--separator-opaque)' }} />
        </div>
      )}

      <div className="sf-card px-3 py-3 group">
        <div className="flex gap-2.5">
          {/* Drag handle */}
          <div className="flex-shrink-0 flex flex-col items-center pt-1 gap-0.5 cursor-grab active:cursor-grabbing" style={{ color: 'var(--label-quaternary)' }}>
            <GripVertical size={14} />
          </div>

          {/* Emoji picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors"
              style={{ background: 'rgba(0,122,255,0.08)' }}
            >
              {meta.emoji || '📍'}
            </button>
            {showEmoji && (
              <div className="absolute top-10 left-0 z-30 rounded-2xl p-2 shadow-xl grid grid-cols-5 gap-1 w-44" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { updateMeta('emoji', e); setShowEmoji(false) }}
                    className="text-lg p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Time + Date row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock size={11} style={{ color: 'var(--label-tertiary)' }} />
                <input
                  type="time"
                  value={meta.time || ''}
                  onChange={e => updateMeta('time', e.target.value)}
                  className="text-xs focus:outline-none bg-transparent font-mono"
                  style={{ color: 'var(--label-secondary)', width: '72px' }}
                />
              </div>
              <input
                type="date"
                value={meta.date || ''}
                onChange={e => updateMeta('date', e.target.value)}
                min={startDate || undefined}
                className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                style={{ border: '1px solid var(--separator-opaque)', background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
              />
            </div>

            {/* Activity name */}
            <input
              type="text"
              value={item.content}
              onChange={e => onUpdate({ content: e.target.value })}
              onBlur={e => updateItem(item.id, { content: e.target.value })}
              placeholder="活動内容（例: 伏見稲荷大社を観光）"
              className="w-full text-sm font-medium focus:outline-none bg-transparent placeholder-gray-300"
              style={{ color: 'var(--label)' }}
            />

            {/* Location */}
            <div className="flex items-center gap-1">
              <MapPin size={11} style={{ color: 'var(--label-tertiary)' }} className="flex-shrink-0" />
              <input
                type="text"
                value={meta.location || ''}
                onChange={e => updateMeta('location', e.target.value)}
                placeholder="場所・住所"
                className="text-xs focus:outline-none bg-transparent w-full"
                style={{ color: 'var(--label-secondary)' }}
              />
            </div>

            {/* Note */}
            <input
              type="text"
              value={meta.note || ''}
              onChange={e => updateMeta('note', e.target.value)}
              placeholder="メモ（要予約、入場料 ¥800 など）"
              className="text-xs focus:outline-none bg-transparent w-full"
              style={{ color: 'var(--label-tertiary)' }}
            />

            {/* Cost */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <div className="flex items-center gap-1">
                <Banknote size={11} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--label-tertiary)' }}>¥</span>
                <input
                  type="number"
                  value={meta.amount ?? ''}
                  onChange={e => updateMeta('amount', e.target.value === '' ? '' : e.target.value)}
                  placeholder="0"
                  className="text-xs focus:outline-none bg-transparent font-mono w-20"
                  style={{ color: meta.amount ? 'var(--green)' : 'var(--label-tertiary)' }}
                />
              </div>
              {(meta.amount && Number(meta.amount) > 0) ? (
                <>
                  <select
                    value={meta.category ?? 'その他'}
                    onChange={e => updateMeta('category', e.target.value)}
                    className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                    style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)' }}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    value={meta.paid_by ?? ''}
                    onChange={e => updateMeta('paid_by', e.target.value)}
                    placeholder="支払者"
                    className="text-xs focus:outline-none rounded-lg px-2 py-0.5"
                    style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)', width: '72px' }}
                  />
                </>
              ) : null}
            </div>

            {/* Photo */}
            {meta.photo_url ? (
              <div className="relative mt-1">
                <img src={meta.photo_url} alt="" className="w-full h-28 object-cover rounded-xl" />
                <button
                  onClick={() => updateMeta('photo_url', '')}
                  className="absolute top-1.5 right-1.5 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs mt-0.5 transition-colors"
                style={{ color: 'var(--label-tertiary)' }}
              >
                {uploading ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                {uploading ? 'アップロード中...' : '写真を追加'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full p-1 self-start"
            style={{ color: 'var(--label-quaternary)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
