'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Calculator, Users, Plus } from 'lucide-react'
import { Section, Itinerary, ScheduleItemMetadata, ExpenseMember } from '@/lib/types'
import { updateSection } from '@/lib/db'

interface Props {
  section: Section
  itinerary: Itinerary
  onUpdate: (section: Section) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  食費:    'rgba(255,149,0,0.12)',
  交通費:  'rgba(0,122,255,0.1)',
  宿泊費:  'rgba(88,86,214,0.1)',
  観光:    'rgba(52,199,89,0.1)',
  お土産:  'rgba(255,45,85,0.1)',
  娯楽:    'rgba(175,82,222,0.1)',
  その他:  'rgba(120,120,128,0.1)',
}
const CATEGORY_LABEL_COLORS: Record<string, string> = {
  食費:    'var(--orange)',
  交通費:  'var(--blue)',
  宿泊費:  '#5856D6',
  観光:    'var(--green)',
  お土産:  'var(--red)',
  娯楽:    'var(--purple)',
  その他:  'var(--label-secondary)',
}

export default function ExpenseSection({ section, itinerary, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  const members: ExpenseMember[] = (section.data?.members as ExpenseMember[]) ?? []

  // Aggregate costs from all schedule sections
  const allScheduleItems = itinerary.sections
    .filter(s => s.type === 'schedule')
    .flatMap(s => s.items)

  const byCategory: Record<string, number> = {}
  let grandTotal = 0
  for (const item of allScheduleItems) {
    const meta = item.metadata as ScheduleItemMetadata
    if (!meta.amount || Number(meta.amount) <= 0) continue
    const cat = meta.category || 'その他'
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(meta.amount)
    grandTotal += Number(meta.amount)
  }

  const totalRatio = members.reduce((s, m) => s + m.ratio, 0)

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

  const hasExpenses = grandTotal > 0

  return (
    <div className="animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full mb-3">
        <h2 className="sf-title-3 text-black flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(52,199,89,0.15)' }}>💴</span>
          {section.title}
          {grandTotal > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
              合計 ¥{grandTotal.toLocaleString()}
            </span>
          )}
        </h2>
        {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-3">

          {/* Category breakdown */}
          {hasExpenses ? (
            <div className="sf-card overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="sf-footnote mb-3" style={{ color: 'var(--label-secondary)' }}>カテゴリ別集計</p>
                <div className="space-y-2">
                  {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] ?? 'rgba(120,120,128,0.1)', color: CATEGORY_LABEL_COLORS[cat] ?? 'var(--label-secondary)', minWidth: '52px', textAlign: 'center' }}>
                        {cat}
                      </span>
                      {/* Bar */}
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--fill-tertiary)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(amt / grandTotal) * 100}%`, background: CATEGORY_LABEL_COLORS[cat] ?? 'var(--label-secondary)' }} />
                      </div>
                      <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--label)', minWidth: '80px', textAlign: 'right' }}>
                        ¥{amt.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total row */}
              <div className="mx-4 mt-3 mb-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--separator-opaque)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--label-secondary)' }}>合計</span>
                <span className="sf-title-3" style={{ color: 'var(--green)' }}>¥{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 rounded-2xl text-sm" style={{ color: 'var(--label-tertiary)', border: '1.5px dashed var(--separator-opaque)' }}>
              <p>スケジュールの各予定に費用を入力すると<br />ここに集計が表示されます</p>
            </div>
          )}

          {/* Split calculator */}
          <div>
            <button
              onClick={() => setShowSplit(!showSplit)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl font-semibold text-sm transition-colors"
              style={{ background: showSplit ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.05)', color: 'var(--blue)' }}
            >
              <Calculator size={15} />
              按分計算機
              {members.length > 0 && grandTotal > 0 && (
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--label-tertiary)' }}>
                  {members.length}人 · 1人あたり ¥{Math.round(grandTotal / members.length).toLocaleString()}〜
                </span>
              )}
              <span className="ml-auto text-xs opacity-50">{showSplit ? '▲' : '▼'}</span>
            </button>

            {showSplit && (
              <div className="mt-2 sf-card p-4 space-y-4 animate-scale-in">
                <p className="sf-footnote flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'var(--blue)' }} />
                  メンバーと負担割合を設定
                </p>

                {members.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--label-tertiary)' }}>
                    まずメンバーを追加してください
                  </p>
                )}

                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ width: '72px' }}>{m.name}</span>
                      <input
                        type="number"
                        value={m.ratio}
                        min={0}
                        max={100}
                        onChange={async e => {
                          const updated = members.map((x, j) => j === i ? { ...x, ratio: Number(e.target.value) } : x)
                          await saveMembersData(updated)
                        }}
                        className="w-16 px-2 py-1.5 rounded-lg text-sm text-center font-mono"
                        style={{ border: '1.5px solid var(--separator-opaque)', background: 'var(--fill-tertiary)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--label-secondary)' }}>%</span>
                      <span className="ml-auto text-sm font-semibold shrink-0" style={{ color: 'var(--green)' }}>
                        ¥{Math.round(grandTotal * m.ratio / 100).toLocaleString()}
                      </span>
                      <button
                        onClick={async () => await saveMembersData(members.filter((_, j) => j !== i))}
                        className="rounded-full p-0.5 transition-colors shrink-0"
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
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-85 flex items-center gap-1"
                    style={{ background: 'var(--blue)' }}
                  >
                    <Plus size={14} /> 追加
                  </button>
                </div>

                {members.length > 1 && (
                  <button onClick={equalSplit} className="text-xs flex items-center gap-1" style={{ color: 'var(--blue)' }}>
                    均等割り（{members.length}人で均等に割る）
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
