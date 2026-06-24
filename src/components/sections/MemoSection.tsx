'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Item, Section } from '@/lib/types'
import { addItem, updateItem } from '@/lib/db'

interface Props {
  section: Section
  onUpdate: (section: Section) => void
}

export default function MemoSection({ section, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const memoItem: Item | undefined = section.items[0]
  const [text, setText] = useState(memoItem?.content ?? '')

  async function handleBlur() {
    if (memoItem) {
      await updateItem(memoItem.id, { content: text })
      onUpdate({ ...section, items: [{ ...memoItem, content: text }] })
    } else {
      const newItem = await addItem(section.id, text, 0)
      if (newItem) {
        onUpdate({ ...section, items: [newItem] })
      }
    }
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <span className="w-7 h-7 bg-stone-100 text-stone-600 rounded-lg flex items-center justify-center text-sm">📝</span>
          {section.title}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-stone-400" /> : <ChevronUp size={18} className="text-stone-400" />}
      </button>

      {!collapsed && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          placeholder="自由にメモを書いてください..."
          rows={6}
          className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none placeholder-stone-300"
        />
      )}
    </div>
  )
}
