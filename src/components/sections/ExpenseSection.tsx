'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Users } from 'lucide-react'
import { Section, Item, ExpenseMember, ExpenseItemMetadata } from '@/lib/types'
import { addItem, updateItem, deleteItem, updateSection } from '@/lib/db'

interface Props {
  section: Section
  onUpdate: (section: Section) => void
}

const CATEGORIES = ['食費', '交通費', '宿泊費', '観光', 'お土産', '娯楽', 'その他']

export default function ExpenseSection({ section, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  const members: ExpenseMember[] = (section.data?.members as ExpenseMember[]) ?? []
  const totalAmount = section.items.reduce((sum, item) => {
    const meta = item.metadata as ExpenseItemMetadata
    return sum + (Number(meta.amount) || 0)
  }, 0)
  const totalRatio = members.reduce((s, m) => s + m.ratio, 0)

  async function addExpenseItem() {
    const meta: ExpenseItemMetadata = { amount: 0, paid_by: '', category: 'その他' }
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

  async function saveMembersData(newMembers: ExpenseMember[]) {
    const newData = { ...section.data, members: newMembers }
    await updateSection(section.id, { data: newData })
    onUpdate({ ...section, data: newData })
  }

  async function addMember() {
    if (!newMemberName.trim()) return
    const remaining = Math.max(0, 100 - totalRatio)
    await saveMembersData([...members, { name: newMemberName.trim(), ratio: remaining }])
    setNewMemberName('')
  }

  async function equalSplit() {
    if (!members.length) return
    const equal = Math.floor(100 / members.length)
    const rem = 100 - equal * members.length
    await saveMembersData(members.map((m, i) => ({ ...m, ratio: equal + (i === 0 ? rem : 0) })))
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 text-black flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(52,199,89,0.15)' }}>💴</span>
          {section.title}
          {totalAmount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
              合計 ¥{totalAmount.toLocaleString()}
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {/* Expense items */}
          {section.items.map((item) => (
            <ExpenseItem
              key={item.id}
              item={item}
              onUpdate={(patch) => handleItemUpdate(item.id, patch)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}

          <button
            onClick={addExpenseItem}
            className="flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl w-full justify-center transition-colors"
            style={{ border: '1.5px dashed rgba(52,199,89,0.4)', color: 'var(--green)' }}
          >
            <Plus size={15} /> 費用を追加
          </button>

          {/* Split calculator */}
          {totalAmount > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowSplit(!showSplit)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl font-semibold text-sm transition-colors"
                style={{ background: showSplit ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.06)', color: 'var(--blue)' }}
              >
                <Calculator size={16} />
                按分計算機
                <span className="ml-auto text-xs opacity-60">{showSplit ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>

              {showSplit && (
                <div className="mt-2 p-4 rounded-2xl sf-card space-y-4 animate-scale-in">
                  <p className="sf-footnote flex items-center gap-1.5">
                    <Users size={13} style={{ color: 'var(--blue)' }} />
                    メンバーと負担割合を設定
                  </p>

                  {/* Member list */}
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-20 truncate">{m.name}</span>
                        <input
                          type="number"
                          value={m.ratio}
                          min={0}
                          max={100}
                          onChange={async (e) => {
                            const updated = members.map((x, j) => j === i ? { ...x, ratio: Number(e.target.value) } : x)
                            await saveMembersData(updated)
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center font-mono"
                          style={{ border: '1.5px solid var(--separator-opaque)', background: 'var(--fill-tertiary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--label-secondary)' }}>%</span>
                        <span className="ml-auto text-sm font-semibold" style={{ color: 'var(--green)' }}>
                          ¥{Math.round(totalAmount * m.ratio / 100).toLocaleString()}
                        </span>
                        <button
                          onClick={async () => await saveMembersData(members.filter((_, j) => j !== i))}
                          className="rounded-full p-0.5 transition-colors"
                          style={{ color: 'var(--label-tertiary)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {members.length > 0 && totalRatio !== 100 && (
                    <p className="text-xs" style={{ color: 'var(--orange)' }}>⚠ 合計 {totalRatio}%（100%になるよう調整してください）</p>
                  )}

                  {/* Add member */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addMember()}
                      placeholder="名前を追加"
                      className="sf-input flex-1 text-sm py-2.5"
                    />
                    <button
                      onClick={addMember}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                      style={{ background: 'var(--blue)' }}
                    >
                      追加
                    </button>
                  </div>

                  {members.length > 1 && (
                    <button onClick={equalSplit} className="text-xs" style={{ color: 'var(--blue)' }}>
                      均等割り（{members.length}人で割る）
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpenseItem({ item, onUpdate, onDelete }: {
  item: Item
  onUpdate: (patch: Partial<Item>) => void
  onDelete: () => void
}) {
  const meta = item.metadata as ExpenseItemMetadata

  function updateMeta(key: keyof ExpenseItemMetadata, value: string | number) {
    onUpdate({ metadata: { ...meta, [key]: value } as Record<string, unknown> })
  }

  return (
    <div className="sf-card px-4 py-3 group animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={item.content}
              onChange={e => onUpdate({ content: e.target.value })}
              placeholder="内容（例: 夕食代）"
              className="flex-1 text-sm font-medium focus:outline-none bg-transparent"
              style={{ color: 'var(--label)' }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs" style={{ color: 'var(--label-secondary)' }}>¥</span>
              <input
                type="number"
                value={meta.amount || ''}
                onChange={e => updateMeta('amount', Number(e.target.value))}
                placeholder="0"
                className="w-24 text-sm text-right font-semibold focus:outline-none bg-transparent"
                style={{ color: 'var(--label)' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={meta.paid_by ?? ''}
              onChange={e => updateMeta('paid_by', e.target.value)}
              placeholder="支払者"
              className="text-xs focus:outline-none rounded-lg px-2 py-1"
              style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', width: '80px' }}
            />
            <select
              value={meta.category ?? 'その他'}
              onChange={e => updateMeta('category', e.target.value)}
              className="text-xs rounded-lg px-2 py-1 focus:outline-none"
              style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-full p-1"
          style={{ color: 'var(--red)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
