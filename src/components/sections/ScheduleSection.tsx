'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Clock, MapPin, ChevronDown, ChevronUp, Camera, Loader2, ChevronUp as Up, ChevronDown as Down, Banknote } from 'lucide-react'
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

  async function addScheduleItem() {
    const meta: ScheduleItemMetadata = {
      date: startDate ? addDays(startDate, 0) : '',
      time: '', location: '', note: '', emoji: '📍', photo_url: '',
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

  async function handleMove(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= section.items.length) return
    const items = [...section.items]
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    const updated = items.map((item, idx) => ({ ...item, position: idx }))
    onUpdate({ ...section, items: updated })
    await Promise.all(updated.map(item => updateItem(item.id, { position: item.position })))
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
            <ScheduleItem
              key={item.id}
              item={item}
              idx={idx}
              total={section.items.length}
              prevDate={idx > 0 ? (section.items[idx - 1].metadata as ScheduleItemMetadata).date : undefined}
              onSave={(patch) => handleItemUpdate(item.id, patch)}
              onDelete={() => handleDelete(item.id)}
              onMoveUp={() => handleMove(idx, idx - 1)}
              onMoveDown={() => handleMove(idx, idx + 1)}
              startDate={startDate}
              sectionId={section.id}
            />
          ))}

          <button
            onClick={addScheduleItem}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl w-full justify-center"
            style={{ border: '1.5px dashed rgba(0,122,255,0.35)', color: 'var(--blue)' }}
          >
            <Plus size={15} /> スケジュールを追加
          </button>
        </div>
      )}
    </div>
  )
}

function ScheduleItem({ item, idx, total, prevDate, onSave, onDelete, onMoveUp, onMoveDown, startDate, sectionId }: {
  item: Item
  idx: number
  total: number
  prevDate?: string
  onSave: (patch: Partial<Item>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  startDate?: string | null
  sectionId: string
}) {
  const meta = item.metadata as ScheduleItemMetadata
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Local state for all text fields (only saved to DB on blur) ──
  const [content, setContent] = useState(item.content)
  const [location, setLocation] = useState(meta.location ?? '')
  const [note, setNote] = useState(meta.note ?? '')
  const [paidBy, setPaidBy] = useState(meta.paid_by ?? '')
  const [amount, setAmount] = useState(meta.amount?.toString() ?? '')

  // Merge updated metadata and save
  function saveMeta(update: Partial<ScheduleItemMetadata>) {
    onSave({ metadata: { ...meta, ...update } as Record<string, unknown> })
  }

  // Immediate-save fields (no IME issue: select/date/time/emoji)
  function updateMetaImmediate(update: Partial<ScheduleItemMetadata>) {
    onSave({ metadata: { ...meta, ...update } as Record<string, unknown> })
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { alert('15MB以下の画像を選択してください'); return }
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `schedule/${sectionId}_${item.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('shiori-images').upload(path, file, { upsert: true })
    if (error) {
      setUploadError('アップロード失敗: ' + error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('shiori-images').getPublicUrl(path)
    saveMeta({ photo_url: data.publicUrl })
    setUploading(false)
  }

  const showDivider = meta.date && meta.date !== prevDate

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
        <div className="flex gap-2">
          {/* Reorder buttons (works on all devices) */}
          <div className="flex flex-col gap-0.5 flex-shrink-0 justify-center">
            <button
              onClick={onMoveUp}
              disabled={idx === 0}
              className="rounded-md p-0.5 transition-colors disabled:opacity-20"
              style={{ color: 'var(--label-tertiary)' }}
            >
              <Up size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1}
              className="rounded-md p-0.5 transition-colors disabled:opacity-20"
              style={{ color: 'var(--label-tertiary)' }}
            >
              <Down size={14} />
            </button>
          </div>

          {/* Emoji picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(0,122,255,0.08)' }}
            >
              {meta.emoji || '📍'}
            </button>
            {showEmoji && (
              <div className="absolute top-10 left-0 z-30 rounded-2xl p-2 shadow-xl grid grid-cols-5 gap-1 w-44"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
                {EMOJIS.map(e => (
                  <button key={e}
                    onClick={() => { updateMetaImmediate({ emoji: e }); setShowEmoji(false) }}
                    className="text-lg p-1 rounded-lg hover:bg-gray-100">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Time + Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock size={11} style={{ color: 'var(--label-tertiary)' }} />
                <input
                  type="time"
                  value={meta.time ?? ''}
                  onChange={e => updateMetaImmediate({ time: e.target.value })}
                  className="text-xs focus:outline-none bg-transparent font-mono"
                  style={{ color: 'var(--label-secondary)', width: '72px' }}
                />
              </div>
              <input
                type="date"
                value={meta.date ?? ''}
                onChange={e => updateMetaImmediate({ date: e.target.value })}
                min={startDate || undefined}
                className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                style={{ border: '1px solid var(--separator-opaque)', background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
              />
            </div>

            {/* Content — local state, save on blur */}
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              onBlur={() => { if (content !== item.content) onSave({ content }) }}
              placeholder="活動内容（例: 伏見稲荷大社を観光）"
              className="w-full text-sm font-medium focus:outline-none bg-transparent"
              style={{ color: 'var(--label)' }}
            />

            {/* Location — local state, save on blur */}
            <div className="flex items-center gap-1">
              <MapPin size={11} style={{ color: 'var(--label-tertiary)' }} className="flex-shrink-0" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onBlur={() => saveMeta({ location })}
                placeholder="場所・住所"
                className="text-xs focus:outline-none bg-transparent w-full"
                style={{ color: 'var(--label-secondary)' }}
              />
            </div>

            {/* Note — local state, save on blur */}
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => saveMeta({ note })}
              placeholder="メモ（要予約、入場料 ¥800 など）"
              className="text-xs focus:outline-none bg-transparent w-full"
              style={{ color: 'var(--label-tertiary)' }}
            />

            {/* Cost — local state, save on blur */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Banknote size={11} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--label-tertiary)' }}>¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onBlur={() => saveMeta({ amount: amount === '' ? undefined : Number(amount) })}
                  placeholder="0"
                  className="text-xs focus:outline-none bg-transparent font-mono w-20"
                  style={{ color: amount && Number(amount) > 0 ? 'var(--green)' : 'var(--label-tertiary)' }}
                />
              </div>
              {amount && Number(amount) > 0 && (
                <>
                  <select
                    value={meta.category ?? 'その他'}
                    onChange={e => updateMetaImmediate({ category: e.target.value })}
                    className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                    style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)' }}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={e => setPaidBy(e.target.value)}
                    onBlur={() => saveMeta({ paid_by: paidBy })}
                    placeholder="支払者"
                    className="text-xs focus:outline-none rounded-lg px-2 py-0.5"
                    style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)', width: '72px' }}
                  />
                </>
              )}
            </div>

            {/* Photo */}
            {meta.photo_url ? (
              <div className="relative mt-1">
                <img src={meta.photo_url} alt="" className="w-full h-28 object-cover rounded-xl" />
                <button
                  onClick={() => saveMeta({ photo_url: '' })}
                  className="absolute top-1.5 right-1.5 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >✕</button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs mt-0.5"
                  style={{ color: 'var(--label-tertiary)' }}
                >
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                  {uploading ? 'アップロード中...' : '写真を追加'}
                </button>
                {uploadError && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{uploadError}</p>}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Delete */}
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
