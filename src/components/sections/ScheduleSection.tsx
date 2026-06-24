'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Clock, MapPin, ChevronDown, ChevronUp, Camera, Loader2, ChevronUp as Up, ChevronDown as Down, Banknote, Timer } from 'lucide-react'
import { Section, Item, ScheduleItemMetadata } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { formatDateShort, addDays } from '@/lib/utils'

// ─── Emoji → category color mapping ───
type EmojiCategory = { color: string; bg: string; shadow: string; label: string }
const DEFAULT_CAT: EmojiCategory = { color: '#8E8E93', bg: 'rgba(142,142,147,0.06)', shadow: 'inset 3px 0 0 #8E8E93', label: 'その他' }

const EMOJI_CATEGORY: Record<string, EmojiCategory> = {
  // 移動 (Transport) — blue
  '🚗': { color: '#007AFF', bg: 'rgba(0,122,255,0.045)', shadow: 'inset 3px 0 0 #007AFF', label: '移動' },
  '🚄': { color: '#007AFF', bg: 'rgba(0,122,255,0.045)', shadow: 'inset 3px 0 0 #007AFF', label: '移動' },
  '✈️': { color: '#007AFF', bg: 'rgba(0,122,255,0.045)', shadow: 'inset 3px 0 0 #007AFF', label: '移動' },
  '🚢': { color: '#007AFF', bg: 'rgba(0,122,255,0.045)', shadow: 'inset 3px 0 0 #007AFF', label: '移動' },
  // 食事 (Food) — orange
  '🍽️': { color: '#FF9500', bg: 'rgba(255,149,0,0.05)', shadow: 'inset 3px 0 0 #FF9500', label: '食事' },
  '☕':  { color: '#FF9500', bg: 'rgba(255,149,0,0.05)', shadow: 'inset 3px 0 0 #FF9500', label: '食事' },
  // 宿泊 (Stay) — purple
  '🏨': { color: '#AF52DE', bg: 'rgba(175,82,222,0.05)', shadow: 'inset 3px 0 0 #AF52DE', label: '宿泊' },
  // 観光 (Sightseeing) — green
  '📍': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '⛩️': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🏖️': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🏔️': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🏯': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🌸': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🌺': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  '🦁': { color: '#34C759', bg: 'rgba(52,199,89,0.05)', shadow: 'inset 3px 0 0 #34C759', label: '観光' },
  // アクティビティ (Activity) — pink
  '🎡': { color: '#FF2D55', bg: 'rgba(255,45,85,0.05)', shadow: 'inset 3px 0 0 #FF2D55', label: 'アクティビティ' },
  '🛍️': { color: '#FF2D55', bg: 'rgba(255,45,85,0.05)', shadow: 'inset 3px 0 0 #FF2D55', label: 'アクティビティ' },
  '🎭': { color: '#FF2D55', bg: 'rgba(255,45,85,0.05)', shadow: 'inset 3px 0 0 #FF2D55', label: 'アクティビティ' },
  '🎵': { color: '#FF2D55', bg: 'rgba(255,45,85,0.05)', shadow: 'inset 3px 0 0 #FF2D55', label: 'アクティビティ' },
  '🎿': { color: '#FF2D55', bg: 'rgba(255,45,85,0.05)', shadow: 'inset 3px 0 0 #FF2D55', label: 'アクティビティ' },
}

const EMOJIS = ['📍','🍽️','🚗','🚄','✈️','🏨','⛩️','🏖️','🎡','🛍️','☕','🌸','🏔️','🎭','🎵','🚢','🎿','🏯','🌺','🦁']
const EXPENSE_CATEGORIES = ['食費', '交通費', '宿泊費', '観光', 'お土産', '娯楽', 'その他']

// Start time options (10-min increments, 00:00 → 23:50)
const TIME_OPTIONS = Array.from({ length: 144 }, (_, i) => {
  const h = Math.floor(i / 6)
  const m = (i % 6) * 10
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// Duration options (10-min increments, nicely labeled)
const DURATION_OPTIONS: { value: number; label: string }[] = [
  ...Array.from({ length: 6 }, (_, i) => {
    const min = (i + 1) * 10
    return { value: min, label: `${min}分` }
  }),
  { value: 70, label: '1時間10分' },
  { value: 80, label: '1時間20分' },
  { value: 90, label: '1時間30分' },
  { value: 100, label: '1時間40分' },
  { value: 110, label: '1時間50分' },
  { value: 120, label: '2時間' },
  { value: 150, label: '2時間30分' },
  { value: 180, label: '3時間' },
  { value: 210, label: '3時間30分' },
  { value: 240, label: '4時間' },
  { value: 300, label: '5時間' },
  { value: 360, label: '6時間' },
  { value: 480, label: '8時間' },
]

function calcEndTime(startTime: string, durationMin: number): string {
  if (!startTime || !durationMin) return ''
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + durationMin
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

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

  async function handleItemSave(itemId: string, patch: Partial<Item>) {
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
          {/* Category legend */}
          <div className="flex flex-wrap gap-2 mb-1 px-1">
            {[
              { color: '#007AFF', label: '移動' },
              { color: '#FF9500', label: '食事' },
              { color: '#AF52DE', label: '宿泊' },
              { color: '#34C759', label: '観光' },
              { color: '#FF2D55', label: 'アクティビティ' },
            ].map(cat => (
              <div key={cat.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                <span className="text-xs" style={{ color: 'var(--label-tertiary)' }}>{cat.label}</span>
              </div>
            ))}
          </div>

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
              onSave={(patch) => handleItemSave(item.id, patch)}
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
  item: Item; idx: number; total: number; prevDate?: string
  onSave: (patch: Partial<Item>) => void; onDelete: () => void
  onMoveUp: () => void; onMoveDown: () => void
  startDate?: string | null; sectionId: string
}) {
  const meta = item.metadata as ScheduleItemMetadata
  const cat = EMOJI_CATEGORY[meta.emoji ?? ''] ?? DEFAULT_CAT
  const endTime = meta.time && meta.duration ? calcEndTime(meta.time, meta.duration) : null

  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Local state for text fields (saves only on blur — prevents IME/Japanese input issues)
  const [content, setContent] = useState(item.content)
  const [location, setLocation] = useState(meta.location ?? '')
  const [note, setNote] = useState(meta.note ?? '')
  const [paidBy, setPaidBy] = useState(meta.paid_by ?? '')
  const [amount, setAmount] = useState(meta.amount?.toString() ?? '')

  function saveMeta(update: Partial<ScheduleItemMetadata>) {
    onSave({ metadata: { ...meta, ...update } as Record<string, unknown> })
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { alert('15MB以下の画像を選択してください'); return }
    setUploading(true); setUploadError('')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `schedule/${sectionId}_${item.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('shiori-images').upload(path, file, { upsert: true })
    if (error) { setUploadError('アップロード失敗: ' + error.message); setUploading(false); return }
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

      {/* Color-coded card: left stripe via box-shadow + subtle background tint */}
      <div className="px-3 py-3 group" style={{
        background: cat.bg || 'var(--bg-elevated)',
        borderRadius: '16px',
        boxShadow: `${cat.shadow}, 0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)`,
      }}>
        <div className="flex gap-2">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 flex-shrink-0 justify-center">
            <button onClick={onMoveUp} disabled={idx === 0}
              className="rounded p-0.5 disabled:opacity-20 transition-colors"
              style={{ color: cat.color }}>
              <Up size={13} />
            </button>
            <button onClick={onMoveDown} disabled={idx === total - 1}
              className="rounded p-0.5 disabled:opacity-20 transition-colors"
              style={{ color: cat.color }}>
              <Down size={13} />
            </button>
          </div>

          {/* Emoji picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
              style={{ background: `${cat.color}18` }}
            >
              {meta.emoji || '📍'}
            </button>
            {showEmoji && (
              <div className="absolute top-10 left-0 z-30 rounded-2xl p-2 shadow-xl grid grid-cols-5 gap-1 w-44"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
                {EMOJIS.map(e => (
                  <button key={e}
                    onClick={() => { saveMeta({ emoji: e }); setShowEmoji(false) }}
                    className="text-lg p-1 rounded-lg hover:bg-gray-100">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Category label */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.label}</span>
            </div>

            {/* Time row: start → end  [duration select] */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock size={11} style={{ color: cat.color }} />
                <select
                  value={meta.time ?? ''}
                  onChange={e => saveMeta({ time: e.target.value })}
                  className="text-xs focus:outline-none rounded-lg px-1.5 py-0.5 font-mono"
                  style={{ color: meta.time ? 'var(--label-secondary)' : 'var(--label-tertiary)', background: 'transparent', border: `1px solid ${meta.time ? cat.color + '40' : 'var(--separator-opaque)'}` }}
                >
                  <option value="">時刻</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* End time (auto-calculated) */}
              {endTime && (
                <div className="flex items-center gap-1 text-xs font-mono" style={{ color: cat.color }}>
                  <span>→</span>
                  <span>{endTime}</span>
                </div>
              )}

              {/* Duration select */}
              <div className="flex items-center gap-1">
                <Timer size={11} style={{ color: 'var(--label-tertiary)' }} />
                <select
                  value={meta.duration ?? ''}
                  onChange={e => saveMeta({ duration: e.target.value ? Number(e.target.value) : undefined })}
                  className="text-xs focus:outline-none rounded-lg px-1.5 py-0.5"
                  style={{ background: 'transparent', color: meta.duration ? cat.color : 'var(--label-tertiary)', border: `1px solid ${meta.duration ? cat.color + '40' : 'var(--separator-opaque)'}`, maxWidth: '100px' }}
                >
                  <option value="">所要時間</option>
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                value={meta.date ?? ''}
                onChange={e => saveMeta({ date: e.target.value })}
                min={startDate || undefined}
                className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                style={{ border: '1px solid var(--separator-opaque)', background: 'rgba(255,255,255,0.6)', color: 'var(--label-secondary)' }}
              />
            </div>

            {/* Content — local state */}
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              onBlur={() => { if (content !== item.content) onSave({ content }) }}
              placeholder="活動内容（例: 伏見稲荷大社を観光）"
              className="w-full text-sm font-semibold focus:outline-none bg-transparent"
              style={{ color: 'var(--label)' }}
            />

            {/* Location — local state */}
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

            {/* Note — local state */}
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => saveMeta({ note })}
              placeholder="メモ（要予約、入場料 ¥800 など）"
              className="text-xs focus:outline-none bg-transparent w-full"
              style={{ color: 'var(--label-tertiary)' }}
            />

            {/* Cost row */}
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
                    onChange={e => saveMeta({ category: e.target.value })}
                    className="text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.7)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)' }}
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
                    style={{ background: 'rgba(255,255,255,0.7)', color: 'var(--label-secondary)', border: '1px solid var(--separator-opaque)', width: '72px' }}
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
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs mt-0.5"
                  style={{ color: 'var(--label-tertiary)' }}>
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                  {uploading ? 'アップロード中...' : '写真を追加'}
                </button>
                {uploadError && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{uploadError}</p>}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Delete */}
          <button onClick={onDelete}
            className="opacity-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full p-1 self-start"
            style={{ color: 'var(--label-quaternary)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
