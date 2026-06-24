'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Home, LayoutList, Menu, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { Itinerary, Section, SectionType, TripMember } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getItinerary, addSection } from '@/lib/db'
import CoverSection from './sections/CoverSection'
import ScheduleSection from './sections/ScheduleSection'
import TodoSection from './sections/TodoSection'
import MemoSection from './sections/MemoSection'
import ExpenseSection from './sections/ExpenseSection'
import MembersSection from './sections/MembersSection'
import PlacesSection from './sections/PlacesSection'

interface Props {
  itinerary: Itinerary
  slug: string
}

// Fixed section list — always shown in this order, auto-created if missing
const DEFAULT_SECTIONS: { type: SectionType; title: string }[] = [
  { type: 'members',  title: '旅のメンバー' },
  { type: 'schedule', title: 'スケジュール' },
  { type: 'places',   title: '候補地リスト' },
  { type: 'todo',     title: 'TODOリスト' },
  { type: 'packing',  title: '持ち物リスト' },
  { type: 'memo',     title: 'メモ' },
  { type: 'expense',  title: '費用管理' },
]

const SECTION_ICONS: Record<SectionType, string> = {
  members:  '👥',
  schedule: '📅',
  places:   '📌',
  todo:     '✅',
  packing:  '🎒',
  memo:     '📝',
  expense:  '💴',
}

const SECTION_SHORT: Record<SectionType, string> = {
  members:  'メンバー',
  schedule: '予定',
  places:   '候補地',
  todo:     'TODO',
  packing:  '持物',
  memo:     'メモ',
  expense:  '費用',
}

// Bottom tab bar: cover + these 4 types
const BOTTOM_TABS: SectionType[] = ['schedule', 'places', 'members', 'expense']

type ActiveKey = 'cover' | SectionType

export default function ItineraryEditor({ itinerary: initial, slug }: Props) {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary>(initial)
  const [active, setActive] = useState<ActiveKey>('cover')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const ensuredRef = useRef(false)

  // Auto-create any missing sections on first load
  useEffect(() => {
    if (ensuredRef.current) return
    ensuredRef.current = true

    const existingTypes = new Set(itinerary.sections.map(s => s.type))
    const missing = DEFAULT_SECTIONS.filter(ds => !existingTypes.has(ds.type))
    if (!missing.length) return

    async function createMissing() {
      let nextPos = itinerary.sections.length
      const created: Section[] = []
      for (const ds of missing) {
        const section = await addSection(itinerary.id, ds.type, ds.title, nextPos++)
        if (section) created.push(section)
      }
      if (created.length) {
        setItinerary(prev => ({ ...prev, sections: [...prev.sections, ...created] }))
      }
    }
    createMissing()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    setSyncing(true)
    const data = await getItinerary(slug)
    if (data) setItinerary(data)
    setSyncing(false)
  }, [slug])

  useEffect(() => {
    const channel = supabase
      .channel(`itinerary:${itinerary.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections', filter: `itinerary_id=eq.${itinerary.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'itineraries', filter: `id=eq.${itinerary.id}` }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [itinerary.id, refresh])

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function updateSection(updated: Section) {
    setItinerary(prev => ({ ...prev, sections: prev.sections.map(s => s.id === updated.id ? updated : s) }))
  }

  // Sections in canonical order (includes both existing and "pending" entries)
  const orderedSections = DEFAULT_SECTIONS.map(ds => ({
    def: ds,
    section: itinerary.sections.find(s => s.type === ds.type) ?? null,
  }))

  const membersSection = itinerary.sections.find(s => s.type === 'members')
  const tripMemberNames: string[] = ((membersSection?.data?.members as TripMember[]) ?? []).map(m => m.name)

  function renderSection(section: Section) {
    switch (section.type) {
      case 'members':
        return <MembersSection key={section.id} section={section} onUpdate={updateSection} />
      case 'schedule':
        return <ScheduleSection key={section.id} section={section} startDate={itinerary.start_date} members={tripMemberNames} onUpdate={updateSection} />
      case 'places':
        return <PlacesSection key={section.id} section={section} onUpdate={updateSection} />
      case 'todo':
        return <TodoSection key={section.id} section={section} onUpdate={updateSection} accentColor="green" icon="✅" />
      case 'packing':
        return <TodoSection key={section.id} section={section} onUpdate={updateSection} accentColor="amber" icon="🎒" />
      case 'memo':
        return <MemoSection key={section.id} section={section} onUpdate={updateSection} />
      case 'expense':
        return <ExpenseSection key={section.id} section={section} itinerary={itinerary} tripMembers={tripMemberNames} onUpdate={updateSection} />
    }
  }

  const activeSection = active !== 'cover'
    ? itinerary.sections.find(s => s.type === active) ?? null
    : null

  function navigate(key: ActiveKey) {
    setActive(key)
    setSidebarOpen(false)
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--separator-opaque)' }}>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 mb-3 text-xs transition-colors"
          style={{ color: 'var(--blue)' }}
        >
          <ArrowLeft size={12} /> トップへ
        </button>
        <div className="sf-headline truncate" style={{ color: 'var(--label)' }}>{itinerary.title}</div>
        <div className="sf-caption mt-0.5 font-mono" style={{ color: 'var(--label-tertiary)' }}>{slug}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <button
          onClick={() => navigate('cover')}
          className={`sf-nav-item ${active === 'cover' ? 'active' : ''}`}
        >
          <Home size={14} /> 表紙
        </button>

        {orderedSections.map(({ def, section }) => (
          <button
            key={def.type}
            onClick={() => navigate(def.type)}
            className={`sf-nav-item ${active === def.type ? 'active' : ''} ${!section ? 'opacity-40' : ''}`}
          >
            <span>{SECTION_ICONS[def.type]}</span>
            <span className="truncate">{def.title}</span>
          </button>
        ))}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--separator-opaque)' }}>
        <button
          onClick={copyUrl}
          className="sf-btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded-xl"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'コピーしました！' : 'URLをコピー'}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="editor-shell flex" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--separator-opaque)' }}>
        <NavContent />
      </aside>

      {/* Mobile slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col shadow-2xl animate-slide-in" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--separator-opaque)' }}>
              <span className="sf-headline">🗺️ メニュー</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1" style={{ color: 'var(--label-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <NavContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--separator-opaque)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--label-secondary)' }}>
            <Menu size={20} />
          </button>
          <span className="sf-headline truncate max-w-[180px]">{itinerary.title}</span>
          <button onClick={refresh} className={syncing ? 'animate-spin' : ''} style={{ color: syncing ? 'var(--blue)' : 'var(--label-tertiary)' }}>
            <RefreshCw size={15} />
          </button>
        </header>

        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--separator-opaque)' }}>
          <div className="flex items-center gap-2 sf-subhead" style={{ color: 'var(--label-secondary)' }}>
            <LayoutList size={13} />
            {active === 'cover'
              ? '🏠 表紙'
              : `${SECTION_ICONS[active as SectionType]} ${DEFAULT_SECTIONS.find(d => d.type === active)?.title ?? ''}`}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className={`flex items-center gap-1 text-xs transition-colors ${syncing ? 'animate-spin' : ''}`} style={{ color: syncing ? 'var(--blue)' : 'var(--label-quaternary)' }}>
              <RefreshCw size={12} />
            </button>
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,199,89,0.1)', color: 'var(--green)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
              リアルタイム同期
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
            {active === 'cover' && (
              <CoverSection
                itinerary={itinerary}
                onUpdate={patch => setItinerary(prev => ({ ...prev, ...patch }))}
              />
            )}

            {active !== 'cover' && activeSection && renderSection(activeSection)}

            {active !== 'cover' && !activeSection && (
              <div className="text-center py-20 animate-fade-in">
                <div className="text-4xl mb-3">{SECTION_ICONS[active as SectionType]}</div>
                <p className="text-sm" style={{ color: 'var(--label-tertiary)' }}>読み込み中...</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden flex flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--separator-opaque)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <button
            onClick={() => navigate('cover')}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
            style={{ color: active === 'cover' ? 'var(--blue)' : 'var(--label-tertiary)' }}
          >
            <Home size={20} />
            <span className="text-[10px]">表紙</span>
          </button>

          {BOTTOM_TABS.map(type => (
            <button
              key={type}
              onClick={() => navigate(type)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
              style={{ color: active === type ? 'var(--blue)' : 'var(--label-tertiary)' }}
            >
              <span className="text-[18px] leading-none">{SECTION_ICONS[type]}</span>
              <span className="text-[10px]">{SECTION_SHORT[type]}</span>
            </button>
          ))}

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
            style={{ color: 'var(--label-tertiary)' }}
          >
            <LayoutList size={20} />
            <span className="text-[10px]">メニュー</span>
          </button>
        </nav>
      </main>
    </div>
  )
}
