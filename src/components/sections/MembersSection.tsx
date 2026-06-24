'use client'

import { useState } from 'react'
import { Plus, X, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Section, TripMember } from '@/lib/types'
import { updateSection } from '@/lib/db'

const MEMBER_COLORS = ['#FF2D55', '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FF6B35', '#30B0C7']

interface Props {
  section: Section
  onUpdate: (section: Section) => void
}

export default function MembersSection({ section, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [newName, setNewName] = useState('')

  const members: TripMember[] = (section.data?.members as TripMember[]) ?? []

  async function saveMembers(updated: TripMember[]) {
    const newData = { ...section.data, members: updated }
    await updateSection(section.id, { data: newData })
    onUpdate({ ...section, data: newData })
  }

  async function addMember() {
    const name = newName.trim()
    if (!name) return
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    const id = crypto.randomUUID()
    await saveMembers([...members, { id, name, color }])
    setNewName('')
  }

  async function removeMember(id: string) {
    await saveMembers(members.filter(m => m.id !== id))
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 flex items-center gap-2" style={{ color: 'var(--label)' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(0,122,255,0.12)' }}>
            👥
          </span>
          {section.title}
          {members.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--blue)' }}>
              {members.length}人
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ color: 'var(--label-tertiary)', border: '1.5px dashed var(--separator-opaque)' }}>
              <Users size={28} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">旅に参加するメンバーを追加しましょう</p>
              <p className="text-xs mt-1 opacity-70">スケジュールの支払者や費用の按分に使われます</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-4 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
              {members.map(m => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: `${m.color}15`, border: `1.5px solid ${m.color}35` }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--label)' }}>{m.name}</span>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="ml-0.5 rounded-full opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: m.color }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              placeholder="名前を入力（例: Alice, たろう）"
              className="sf-input flex-1 text-sm py-2.5"
            />
            <button
              onClick={addMember}
              disabled={!newName.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity flex items-center gap-1.5 shrink-0"
              style={{ background: 'var(--blue)' }}
            >
              <Plus size={14} /> 追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
