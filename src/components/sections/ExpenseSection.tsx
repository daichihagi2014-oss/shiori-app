'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Calculator, Users, Plus, ArrowRight } from 'lucide-react'

// Local-state input to avoid controlled-input re-render issues on mobile
function RatioInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [local, setLocal] = useState(String(value))
  return (
    <input
      type="number"
      value={local}
      min={0}
      max={100}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = parseInt(local, 10)
        if (!isNaN(n) && n >= 0 && n <= 100) { onSave(n) }
        else setLocal(String(value))
      }}
      className="w-16 px-2 py-1.5 rounded-lg text-sm text-center font-mono"
      style={{ border: '1.5px solid var(--separator-opaque)', background: 'var(--fill-tertiary)' }}
    />
  )
}
import { Section, Itinerary, ScheduleItemMetadata, ExpenseMember } from '@/lib/types'
import { updateSection } from '@/lib/db'

interface Props {
  section: Section
  itinerary: Itinerary
  tripMembers?: string[]
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

function calcSettlement(balances: { name: string; balance: number }[]) {
  const creds = balances.filter(b => b.balance > 1).map(b => ({ ...b })).sort((a, b) => b.balance - a.balance)
  const debts = balances.filter(b => b.balance < -1).map(b => ({ ...b })).sort((a, b) => a.balance - b.balance)
  const txns: { from: string; to: string; amount: number }[] = []
  let ci = 0, di = 0
  while (ci < creds.length && di < debts.length) {
    const amt = Math.min(creds[ci].balance, -debts[di].balance)
    txns.push({ from: debts[di].name, to: creds[ci].name, amount: Math.round(amt) })
    creds[ci].balance -= amt
    debts[di].balance += amt
    if (creds[ci].balance < 1) ci++
    if (debts[di].balance > -1) di++
  }
  return txns
}

export default function ExpenseSection({ section, itinerary, tripMembers = [], onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  // Legacy self-managed members (used when no trip members section exists)
  const legacyMembers: ExpenseMember[] = (section.data?.members as ExpenseMember[]) ?? []
  // Ratios stored per-member name
  const ratios: Record<string, number> = (section.data?.ratios as Record<string, number>) ?? {}

  const useTripMembers = tripMembers.length > 0
  const activeMembers: string[] = useTripMembers ? tripMembers : legacyMembers.map(m => m.name)

  // Aggregate costs from all schedule sections
  const allScheduleItems = itinerary.sections
    .filter(s => s.type === 'schedule')
    .flatMap(s => s.items)

  const byCategory: Record<string, number> = {}
  const paidByMember: Record<string, number> = {}
  let grandTotal = 0

  for (const item of allScheduleItems) {
    const meta = item.metadata as ScheduleItemMetadata
    if (!meta.amount || Number(meta.amount) <= 0) continue
    const amt = Number(meta.amount)
    const cat = meta.category || 'その他'
    byCategory[cat] = (byCategory[cat] ?? 0) + amt
    grandTotal += amt
    if (meta.paid_by) {
      paidByMember[meta.paid_by] = (paidByMember[meta.paid_by] ?? 0) + amt
    }
  }

  function getRatio(name: string): number {
    if (useTripMembers) {
      return ratios[name] ?? (activeMembers.length ? Math.floor(100 / activeMembers.length) : 0)
    }
    return legacyMembers.find(m => m.name === name)?.ratio ?? 0
  }

  const totalRatio = activeMembers.reduce((s, name) => s + getRatio(name), 0)

  // Per-member balance: paid - share
  const memberBalances = activeMembers.map(name => {
    const paid = paidByMember[name] ?? 0
    const share = grandTotal * getRatio(name) / 100
    return { name, paid, share: Math.round(share), balance: paid - share }
  })
  const settlements = memberBalances.length > 1 ? calcSettlement(memberBalances.map(b => ({ name: b.name, balance: b.balance }))) : []

  async function saveData(patch: Record<string, unknown>) {
    const newData = { ...section.data, ...patch }
    await updateSection(section.id, { data: newData })
    onUpdate({ ...section, data: newData })
  }

  // Used only in legacy mode
  async function addLegacyMember() {
    if (!newMemberName.trim()) return
    const remaining = Math.max(0, 100 - totalRatio)
    await saveData({ members: [...legacyMembers, { name: newMemberName.trim(), ratio: remaining }] })
    setNewMemberName('')
  }

  async function updateRatio(name: string, val: number) {
    if (useTripMembers) {
      await saveData({ ratios: { ...ratios, [name]: val } })
    } else {
      await saveData({ members: legacyMembers.map(m => m.name === name ? { ...m, ratio: val } : m) })
    }
  }

  async function removeLegacyMember(name: string) {
    await saveData({ members: legacyMembers.filter(m => m.name !== name) })
  }

  async function equalSplit() {
    if (!activeMembers.length) return
    const equal = Math.floor(100 / activeMembers.length)
    const rem = 100 - equal * activeMembers.length
    if (useTripMembers) {
      const newRatios: Record<string, number> = {}
      activeMembers.forEach((name, i) => { newRatios[name] = equal + (i === 0 ? rem : 0) })
      await saveData({ ratios: newRatios })
    } else {
      await saveData({ members: legacyMembers.map((m, i) => ({ ...m, ratio: equal + (i === 0 ? rem : 0) })) })
    }
  }

  const hasExpenses = grandTotal > 0
  const hasPaidData = Object.keys(paidByMember).length > 0

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

          {/* Per-member payment summary */}
          {hasExpenses && hasPaidData && activeMembers.length > 0 && (
            <div className="sf-card overflow-hidden">
              <div className="px-4 py-4">
                <p className="sf-footnote mb-3 flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'var(--blue)' }} />
                  メンバー別支払い状況
                </p>
                <div className="space-y-2">
                  {memberBalances.map(({ name, paid, share, balance }) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-sm font-medium shrink-0" style={{ minWidth: '60px', color: 'var(--label)' }}>{name}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'var(--label-tertiary)' }}>支払済 ¥{paid.toLocaleString()}</span>
                          <span style={{ color: 'var(--label-tertiary)' }}>負担 ¥{share.toLocaleString()}</span>
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                        style={{
                          background: balance >= 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.1)',
                          color: balance >= 0 ? 'var(--green)' : 'var(--red)',
                          minWidth: '72px',
                          textAlign: 'right',
                        }}
                      >
                        {balance >= 0 ? '+' : ''}¥{Math.round(balance).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Settlement */}
                {settlements.length > 0 && (
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--separator-opaque)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--label-secondary)' }}>精算</p>
                    <div className="space-y-1.5">
                      {settlements.map((txn, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium" style={{ color: 'var(--red)' }}>{txn.from}</span>
                          <ArrowRight size={13} style={{ color: 'var(--label-tertiary)' }} />
                          <span className="font-medium" style={{ color: 'var(--green)' }}>{txn.to}</span>
                          <span className="ml-auto font-semibold" style={{ color: 'var(--label)' }}>¥{txn.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
              {activeMembers.length > 0 && grandTotal > 0 && (
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--label-tertiary)' }}>
                  {activeMembers.length}人
                </span>
              )}
              <span className="ml-auto text-xs opacity-50">{showSplit ? '▲' : '▼'}</span>
            </button>

            {showSplit && (
              <div className="mt-2 sf-card p-4 space-y-4 animate-scale-in">
                <p className="sf-footnote flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'var(--blue)' }} />
                  {useTripMembers ? 'メンバーごとの負担割合' : 'メンバーと負担割合を設定'}
                </p>

                {useTripMembers && activeMembers.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--label-tertiary)' }}>
                    「旅のメンバー」セクションでメンバーを追加してください
                  </p>
                )}

                {!useTripMembers && legacyMembers.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--label-tertiary)' }}>
                    まずメンバーを追加してください
                  </p>
                )}

                <div className="space-y-2">
                  {activeMembers.map(name => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ width: '72px' }}>{name}</span>
                      <RatioInput
                        key={`${name}-${getRatio(name)}`}
                        value={getRatio(name)}
                        onSave={v => updateRatio(name, v)}
                      />
                      <span className="text-sm" style={{ color: 'var(--label-secondary)' }}>%</span>
                      <span className="ml-auto text-sm font-semibold shrink-0" style={{ color: 'var(--green)' }}>
                        ¥{Math.round(grandTotal * getRatio(name) / 100).toLocaleString()}
                      </span>
                      {!useTripMembers && (
                        <button
                          onClick={async () => removeLegacyMember(name)}
                          className="rounded-full p-0.5 transition-colors shrink-0"
                          style={{ color: 'var(--label-tertiary)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {activeMembers.length > 0 && totalRatio !== 100 && (
                  <p className="text-xs" style={{ color: 'var(--orange)' }}>⚠ 合計 {totalRatio}%（100%になるよう調整してください）</p>
                )}

                {!useTripMembers && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addLegacyMember()}
                      placeholder="名前を追加"
                      className="sf-input flex-1 text-sm py-2.5"
                    />
                    <button
                      onClick={addLegacyMember}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-85 flex items-center gap-1"
                      style={{ background: 'var(--blue)' }}
                    >
                      <Plus size={14} /> 追加
                    </button>
                  </div>
                )}

                {activeMembers.length > 1 && (
                  <button onClick={equalSplit} className="text-xs flex items-center gap-1" style={{ color: 'var(--blue)' }}>
                    均等割り（{activeMembers.length}人で均等に割る）
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
