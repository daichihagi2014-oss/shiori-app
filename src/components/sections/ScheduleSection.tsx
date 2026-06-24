'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { Section, Item, ScheduleItemMetadata } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'
import { formatDateShort, addDays } from '@/lib/utils'

const EMOJIS = ['📍', '🍽️', '🚗', '🚄', '✈️', '🏨', '⛩️', '🏖️', '🎡', '🛍️', '☕', '🌸', '🏔️', '🎭', '🎵']

interface Props {
  section: Section
  startDate?: string | null
  onUpdate: (section: Section) => void
}

export default function ScheduleSection({ section, startDate, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  async function addScheduleItem() {
    const position = section.items.length
    const meta: ScheduleItemMetadata = {
      date: startDate ? addDays(startDate, 0) : '',
      time: '',
      location: '',
      note: '',
      emoji: '📍',
    }
    const newItem = await addItem(section.id, '', position, meta as Record<string, unknown>)
    if (newItem) {
      onUpdate({ ...section, items: [...section.items, newItem] })
    }
  }

  async function handleItemUpdate(itemId: string, patch: Partial<Item>) {
    await updateItem(itemId, patch)
    onUpdate({
      ...section,
      items: section.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter((it) => it.id !== itemId) })
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <span className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">📅</span>
          {section.title}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-stone-400" /> : <ChevronUp size={18} className="text-stone-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {section.items.length === 0 && (
            <div className="text-stone-400 text-sm text-center py-6 border-2 border-dashed border-stone-200 rounded-xl">
              スケジュールを追加しましょう
            </div>
          )}

          {section.items.map((item, idx) => (
            <ScheduleItem
              key={item.id}
              item={item}
              isFirst={idx === 0}
              prevDate={idx > 0 ? (section.items[idx - 1].metadata as ScheduleItemMetadata).date : undefined}
              onUpdate={(patch) => handleItemUpdate(item.id, patch)}
              onDelete={() => handleDelete(item.id)}
              startDate={startDate}
            />
          ))}

          <button
            onClick={addScheduleItem}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors w-full justify-center border border-dashed border-indigo-200"
          >
            <Plus size={15} /> スケジュールを追加
          </button>
        </div>
      )}
    </div>
  )
}

function ScheduleItem({
  item,
  onUpdate,
  onDelete,
  startDate,
  prevDate,
}: {
  item: Item
  isFirst: boolean
  prevDate?: string
  onUpdate: (patch: Partial<Item>) => void
  onDelete: () => void
  startDate?: string | null
}) {
  const [showEmoji, setShowEmoji] = useState(false)
  const meta = item.metadata as ScheduleItemMetadata
  const showDateDivider = meta.date && meta.date !== prevDate

  function updateMeta(key: keyof ScheduleItemMetadata, value: string) {
    const newMeta = { ...meta, [key]: value }
    onUpdate({ metadata: newMeta as Record<string, unknown> })
  }

  return (
    <div className="animate-slide-in">
      {showDateDivider && meta.date && (
        <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
          <div className="flex-1 h-px bg-stone-200"></div>
          <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {formatDateShort(meta.date)}
          </span>
          <div className="flex-1 h-px bg-stone-200"></div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-3 group hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-3">
          {/* Emoji selector */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-lg hover:bg-indigo-100 transition-colors flex-shrink-0"
            >
              {meta.emoji || '📍'}
            </button>
            {showEmoji && (
              <div className="absolute top-10 left-0 z-20 bg-white border border-stone-200 rounded-xl p-2 shadow-lg grid grid-cols-5 gap-1 w-40">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { updateMeta('emoji', e); setShowEmoji(false) }}
                    className="text-lg p-1 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Time and date row */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <Clock size={11} />
                <input
                  type="time"
                  value={meta.time || ''}
                  onChange={(e) => updateMeta('time', e.target.value)}
                  className="text-xs border-none focus:outline-none text-stone-600 w-16 bg-transparent"
                />
              </div>
              <input
                type="date"
                value={meta.date || ''}
                onChange={(e) => updateMeta('date', e.target.value)}
                min={startDate || undefined}
                className="text-xs border border-stone-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-stone-600 bg-white"
              />
            </div>

            {/* Content / activity name */}
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onBlur={(e) => onUpdate({ content: e.target.value })}
              placeholder="活動内容を入力（例: 伏見稲荷大社を観光）"
              className="w-full font-medium text-stone-800 text-sm focus:outline-none placeholder-stone-300 bg-transparent"
            />

            {/* Location */}
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-stone-400 flex-shrink-0" />
              <input
                type="text"
                value={meta.location || ''}
                onChange={(e) => updateMeta('location', e.target.value)}
                placeholder="場所・住所"
                className="text-xs text-stone-500 focus:outline-none placeholder-stone-300 w-full bg-transparent"
              />
            </div>

            {/* Note */}
            <input
              type="text"
              value={meta.note || ''}
              onChange={(e) => updateMeta('note', e.target.value)}
              placeholder="メモ（例: 要予約、入場料800円）"
              className="text-xs text-stone-400 focus:outline-none placeholder-stone-300 w-full mt-0.5 bg-transparent"
            />
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all flex-shrink-0 p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
