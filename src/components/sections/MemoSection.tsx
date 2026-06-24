'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Section, Item } from '@/lib/types'
import { addItem, updateItem, deleteItem } from '@/lib/db'

interface Props {
  section: Section
  onUpdate: (section: Section) => void
}

export default function MemoSection({ section, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  async function handleAdd() {
    const newItem = await addItem(section.id, '', section.items.length)
    if (newItem) onUpdate({ ...section, items: [...section.items, newItem] })
  }

  async function handleUpdate(item: Item, content: string) {
    await updateItem(item.id, { content })
    onUpdate({ ...section, items: section.items.map(i => i.id === item.id ? { ...i, content } : i) })
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    onUpdate({ ...section, items: section.items.filter(i => i.id !== itemId) })
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 text-black flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(255,204,0,0.18)' }}>📝</span>
          {section.title}
          <span className="sf-footnote ml-1">{section.items.length}件</span>
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {section.items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              メモを追加してください
            </div>
          )}

          {section.items.map((item) => (
            <div key={item.id} className="relative group animate-slide-in">
              <textarea
                defaultValue={item.content}
                onBlur={(e) => handleUpdate(item, e.target.value)}
                placeholder="メモを入力..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none"
                style={{
                  background: 'rgba(255,204,0,0.1)',
                  border: '1.5px solid rgba(255,204,0,0.35)',
                  color: 'var(--label)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full p-1"
                style={{ background: 'rgba(255,59,48,0.1)', color: 'var(--red)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl w-full justify-center transition-colors"
            style={{
              border: '1.5px dashed rgba(255,204,0,0.5)',
              color: 'rgba(180,140,0,1)',
            }}
          >
            <Plus size={15} /> メモを追加
          </button>
        </div>
      )}
    </div>
  )
}
