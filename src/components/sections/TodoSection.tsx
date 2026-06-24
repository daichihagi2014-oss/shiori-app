'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Section, Item } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'

interface Props {
  section: Section
  onUpdate: (section: Section) => void
  accentColor?: string
  icon?: string
}

export default function TodoSection({ section, onUpdate, accentColor = 'green', icon = '✅' }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const checked = section.items.filter((i) => i.is_checked).length
  const total = section.items.length

  async function handleAdd() {
    if (!newText.trim()) { setAdding(false); return }
    const position = section.items.length
    const newItem = await addItem(section.id, newText.trim(), position)
    if (newItem) {
      onUpdate({ ...section, items: [...section.items, newItem] })
    }
    setNewText('')
    setAdding(false)
  }

  async function handleToggle(item: Item) {
    const patch = { is_checked: !item.is_checked }
    await updateItem(item.id, patch)
    onUpdate({ ...section, items: section.items.map((it) => (it.id === item.id ? { ...it, ...patch } : it)) })
  }

  async function handleContentChange(item: Item, content: string) {
    await updateItem(item.id, { content })
    onUpdate({ ...section, items: section.items.map((it) => (it.id === item.id ? { ...it, content } : it)) })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter((it) => it.id !== itemId) })
  }

  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  const checkColor: Record<string, string> = {
    green: 'text-green-500 border-green-300 bg-green-50',
    amber: 'text-amber-500 border-amber-300 bg-amber-50',
    blue: 'text-blue-500 border-blue-300 bg-blue-50',
    indigo: 'text-indigo-500 border-indigo-300 bg-indigo-50',
  }
  const addColor: Record<string, string> = {
    green: 'text-green-600 hover:bg-green-50 border-green-200',
    amber: 'text-amber-600 hover:bg-amber-50 border-amber-200',
    blue: 'text-blue-600 hover:bg-blue-50 border-blue-200',
    indigo: 'text-indigo-600 hover:bg-indigo-50 border-indigo-200',
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${colorMap[accentColor]}`}>
            {icon}
          </span>
          {section.title}
          {total > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[accentColor]}`}>
              {checked}/{total}
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-stone-400" /> : <ChevronUp size={18} className="text-stone-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-1.5">
          {section.items.length === 0 && !adding && (
            <div className="text-stone-400 text-sm text-center py-5 border-2 border-dashed border-stone-200 rounded-xl">
              アイテムを追加しましょう
            </div>
          )}

          {section.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 py-2 px-3 bg-white rounded-xl border border-stone-200 group hover:shadow-sm transition-shadow animate-slide-in"
            >
              <button
                onClick={() => handleToggle(item)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  item.is_checked
                    ? checkColor[accentColor] + ' border-opacity-50'
                    : 'border-stone-300 hover:border-stone-400'
                }`}
              >
                {item.is_checked && <span className="text-xs">✓</span>}
              </button>
              <input
                type="text"
                value={item.content}
                onChange={(e) => handleContentChange(item, e.target.value)}
                className={`flex-1 text-sm focus:outline-none bg-transparent transition-all ${
                  item.is_checked ? 'line-through text-stone-400' : 'text-stone-700'
                }`}
              />
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {adding && (
            <div className="flex items-center gap-2.5 py-2 px-3 bg-white rounded-xl border-2 border-indigo-300">
              <div className="w-5 h-5 rounded border-2 border-stone-300 flex-shrink-0"></div>
              <input
                ref={inputRef}
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onBlur={handleAdd}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewText('') } }}
                placeholder="アイテムを入力..."
                autoFocus
                className="flex-1 text-sm focus:outline-none bg-transparent text-stone-700"
              />
            </div>
          )}

          <button
            onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0) }}
            className={`flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-xl transition-colors w-full justify-center border border-dashed ${addColor[accentColor]}`}
          >
            <Plus size={15} /> アイテムを追加
          </button>
        </div>
      )}
    </div>
  )
}
