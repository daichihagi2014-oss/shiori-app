'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plus, Home, LayoutList, Menu, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { Itinerary, Section, SectionType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getItinerary, addSection, deleteSection } from '@/lib/db'
import CoverSection from './sections/CoverSection'
import ScheduleSection from './sections/ScheduleSection'
import TodoSection from './sections/TodoSection'
import MemoSection from './sections/MemoSection'
import ExpenseSection from './sections/ExpenseSection'

interface Props {
  itinerary: Itinerary
  slug: string
}

const SECTION_ICONS: Record<SectionType, string> = {
  schedule: '📅',
  todo:     '✅',
  packing:  '🎒',
  memo:     '📝',
  expense:  '💴',
}

const SECTION_SHORT: Record<SectionType, string> = {
  schedule: '予定',
  todo:     'TODO',
  packing:  '持物',
  memo:     'メモ',
  expense:  '費用',
}

const SECTION_ADD_OPTIONS: { type: SectionType; label: string }[] = [
  { type: 'schedule', label: '📅 スケジュール' },
  { type: 'todo',     label: '✅ TODOリスト' },
  { type: 'packing',  label: '🎒 持ち物リスト' },
  { type: 'memo',     label: '📝 メモ' },
  { type: 'expense',  label: '💴 費用管理' },
]

const SECTION_TITLES: Record<SectionType, string> = {
  schedule: 'スケジュール',
  todo:     'TODOリスト',
  packing:  '持ち物リスト',
  memo:     'メモ',
  expense:  '費用管理',
}

export default function ItineraryEditor({ itinerary: initial, slug }: Props) {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary>(initial)
  const [activeSection, setActiveSection] = useState<string>('cover')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [syncing, setSyncing] = useState(false)

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

  async function handleAddSection(type: SectionType) {
    setShowAddMenu(false)
    const section = await addSection(itinerary.id, type, SECTION_TITLES[type], itinerary.sections.length)
    if (section) {
      setItinerary(prev => ({ ...prev, sections: [...prev.sections, section] }))
      setActiveSection(section.id)
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('このセクションを削除しますか？')) return
    await deleteSection(sectionId)
    setItinerary(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }))
    setActiveSection('cover')
  }

  function renderSection(section: Section) {
    switch (section.type) {
      case 'schedule':
        return <ScheduleSection key={section.id} section={section} startDate={itinerary.start_date} onUpdate={updateSection} />
      case 'todo':
        return <TodoSection key={section.id} section={section} onUpdate={updateSection} accentColor="green" icon="✅" />
      case 'packing':
        return <TodoSection key={section.id} section={section} onUpdate={updateSection} accentColor="amber" icon="🎒" />
      case 'memo':
        return <MemoSection key={section.id} section={section} onUpdate={updateSection} />
      case 'expense':
        return <ExpenseSection key={section.id} section={section} itinerary={itinerary} onUpdate={updateSection} />
    }
  }

  const allSections = itinerary.sections
  const activeSectionData = allSections.find(s => s.id === activeSection)

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Top: back + title */}
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

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <button
          onClick={() => { setActiveSection('cover'); setSidebarOpen(false) }}
          className={`sf-nav-item ${activeSection === 'cover' ? 'active' : ''}`}
        >
          <Home size={14} /> 表紙
        </button>

        {allSections.map(s => (
          <div key={s.id} className="group relative">
            <button
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false) }}
              className={`sf-nav-item pr-8 ${activeSection === s.id ? 'active' : ''}`}
            >
              <span>{SECTION_ICONS[s.type]}</span>
              <span className="truncate">{s.title}</span>
            </button>
            <button
              onClick={() => handleDeleteSection(s.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5"
              style={{ color: 'var(--label-quaternary)' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Add section */}
        <div className="relative pt-2">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors"
            style={{
              border: '1.5px dashed var(--separator-opaque)',
              color: 'var(--label-tertiary)',
            }}
          >
            <Plus size={13} /> セクションを追加
          </button>
          {showAddMenu && (
            <div className="absolute bottom-full left-0 mb-1 rounded-xl shadow-xl overflow-hidden z-20 w-48 animate-scale-in"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator-opaque)' }}>
              {SECTION_ADD_OPTIONS.map(o => (
                <button
                  key={o.type}
                  onClick={() => handleAddSection(o.type)}
                  className="flex items-center w-full px-4 py-2.5 text-sm transition-colors text-left"
                  style={{ color: 'var(--label)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share */}
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--separator-opaque)' }}>
        <NavContent />
      </aside>

      {/* Mobile slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
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

        {/* Desktop breadcrumb bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--separator-opaque)' }}>
          <div className="flex items-center gap-2 sf-subhead" style={{ color: 'var(--label-secondary)' }}>
            <LayoutList size={13} />
            {activeSectionData
              ? `${SECTION_ICONS[activeSectionData.type]} ${activeSectionData.title}`
              : '🏠 表紙'}
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
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-8">
            {(activeSection === 'cover' || !activeSectionData) && (
              <CoverSection
                itinerary={itinerary}
                onUpdate={patch => setItinerary(prev => ({ ...prev, ...patch }))}
              />
            )}

            {activeSectionData && renderSection(activeSectionData)}

            {activeSection === 'cover' && allSections.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="text-5xl mb-5">✈️</div>
                <h2 className="sf-title-3 mb-2" style={{ color: 'var(--label)' }}>セクションを追加しましょう</h2>
                <p className="sf-footnote mb-8">サイドバーの「＋ セクションを追加」から始めてください</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SECTION_ADD_OPTIONS.map(o => (
                    <button
                      key={o.type}
                      onClick={() => handleAddSection(o.type)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors sf-card"
                      style={{ color: 'var(--label-secondary)' }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden flex flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--separator-opaque)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <button
            onClick={() => setActiveSection('cover')}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors"
            style={{ color: activeSection === 'cover' ? 'var(--blue)' : 'var(--label-tertiary)' }}
          >
            <Home size={20} />
            <span className="text-[10px]">表紙</span>
          </button>

          {allSections.slice(0, 3).map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors"
              style={{ color: activeSection === s.id ? 'var(--blue)' : 'var(--label-tertiary)' }}
            >
              <span className="text-[18px] leading-none">{SECTION_ICONS[s.type]}</span>
              <span className="text-[10px]">{SECTION_SHORT[s.type]}</span>
            </button>
          ))}

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors"
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
