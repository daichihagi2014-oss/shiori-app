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

const ACCENT: Record<string, { badge: string; check: string; add: string; border: string }> = {
  green: { badge: 'rgba(52,199,89,0.12)', check: 'var(--green)', add: 'rgba(52,199,89,0.35)', border: 'rgba(52,199,89,0.15)' },
  amber: { badge: 'rgba(255,149,0,0.12)', check: 'var(--orange)', add: 'rgba(255,149,0,0.35)', border: 'rgba(255,149,0,0.15)' },
  blue:  { badge: 'rgba(0,122,255,0.1)',  check: 'var(--blue)',  add: 'rgba(0,122,255,0.3)',  border: 'rgba(0,122,255,0.12)' },
}

function TodoItem({ item, accentColor, onToggle, onSave, onDelete }: {
  item: Item
  accentColor: string
  onToggle: () => void
  onSave: (content: string) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(item.content)
  const ac = ACCENT[accentColor] ?? ACCENT.green

  return (
    <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl group animate-slide-in"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
      <button
        onClick={onToggle}
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2"
        style={{
          borderColor: item.is_checked ? ac.check : 'var(--separator-opaque)',
          background: item.is_checked ? ac.badge : 'transparent',
        }}
      >
        {item.is_checked && (
          <span style={{ color: ac.check, fontSize: '11px', fontWeight: 700 }}>✓</span>
        )}
      </button>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => { if (value !== item.content) onSave(value) }}
        className="flex-1 text-sm focus:outline-none bg-transparent"
        style={{
          color: item.is_checked ? 'var(--label-tertiary)' : 'var(--label)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
        }}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: 'var(--label-quaternary)' }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function TodoSection({ section, onUpdate, accentColor = 'green', icon = '✅' }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const ac = ACCENT[accentColor] ?? ACCENT.green

  const checked = section.items.filter(i => i.is_checked).length

  async function handleAdd() {
    const text = newText.trim()
    setAdding(false)
    setNewText('')
    if (!text) return
    const newItem = await addItem(section.id, text, section.items.length)
    if (newItem) onUpdate({ ...section, items: [...section.items, newItem] })
  }

  async function handleToggle(item: Item) {
    const patch = { is_checked: !item.is_checked }
    await updateItem(item.id, patch)
    onUpdate({ ...section, items: section.items.map(it => it.id === item.id ? { ...it, ...patch } : it) })
  }

  async function handleSave(item: Item, content: string) {
    await updateItem(item.id, { content })
    onUpdate({ ...section, items: section.items.map(it => it.id === item.id ? { ...it, content } : it) })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter(it => it.id !== itemId) })
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 flex items-center gap-2" style={{ color: 'var(--label)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: ac.badge }}>
            {icon}
          </span>
          {section.title}
          {section.items.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: ac.badge, color: ac.check }}>
              {checked}/{section.items.length}
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-1.5">
          {section.items.length === 0 && !adding && (
            <div className="text-center py-6 rounded-2xl text-sm" style={{ color: 'var(--label-tertiary)', border: '1.5px dashed var(--separator-opaque)' }}>
              アイテムを追加しましょう
            </div>
          )}

          {section.items.map(item => (
            <TodoItem
              key={item.id}
              item={item}
              accentColor={accentColor}
              onToggle={() => handleToggle(item)}
              onSave={(content) => handleSave(item, content)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}

          {adding && (
            <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: `2px solid ${ac.check}` }}>
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--separator-opaque)' }} />
              <input
                ref={inputRef}
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onBlur={handleAdd}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewText('') } }}
                placeholder="アイテムを入力..."
                autoFocus
                className="flex-1 text-sm focus:outline-none bg-transparent"
                style={{ color: 'var(--label)' }}
              />
            </div>
          )}

          <button
            onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-3 rounded-xl w-full justify-center"
            style={{ border: `1.5px dashed ${ac.add}`, color: ac.check }}
          >
            <Plus size={15} /> アイテムを追加
          </button>
        </div>
      )}
    </div>
  )
}
