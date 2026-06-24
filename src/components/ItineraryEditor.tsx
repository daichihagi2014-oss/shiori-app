'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy, Check, Plus,
  Home, LayoutList, Menu, X, RefreshCw, ArrowLeft
} from 'lucide-react'
import { Itinerary, Section, SectionType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getItinerary, addSection, deleteSection } from '@/lib/db'
import CoverSection from './sections/CoverSection'
import ScheduleSection from './sections/ScheduleSection'
import TodoSection from './sections/TodoSection'
import MemoSection from './sections/MemoSection'

interface Props {
  itinerary: Itinerary
  slug: string
}

const SECTION_ICONS: Record<SectionType, string> = {
  schedule: '📅',
  todo: '✅',
  packing: '🎒',
  memo: '📝',
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

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`itinerary:${itinerary.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections', filter: `itinerary_id=eq.${itinerary.id}` }, () => { refresh() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => { refresh() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'itineraries', filter: `id=eq.${itinerary.id}` }, () => { refresh() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [itinerary.id, refresh])

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function updateSection(updated: Section) {
    setItinerary((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === updated.id ? updated : s)),
    }))
  }

  async function handleAddSection(type: SectionType) {
    setShowAddMenu(false)
    const titles: Record<SectionType, string> = {
      schedule: 'スケジュール',
      todo: 'TODOリスト',
      packing: '持ち物リスト',
      memo: 'メモ',
    }
    const position = itinerary.sections.length
    const section = await addSection(itinerary.id, type, titles[type], position)
    if (section) {
      setItinerary((prev) => ({ ...prev, sections: [...prev.sections, section] }))
      setActiveSection(section.id)
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('このセクションを削除しますか？')) return
    await deleteSection(sectionId)
    setItinerary((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }))
    setActiveSection('cover')
  }

  const allSections = itinerary.sections

  function renderSection(section: Section) {
    switch (section.type) {
      case 'schedule':
        return (
          <ScheduleSection
            key={section.id}
            section={section}
            startDate={itinerary.start_date}
            onUpdate={updateSection}
          />
        )
      case 'todo':
        return (
          <TodoSection
            key={section.id}
            section={section}
            onUpdate={updateSection}
            accentColor="green"
            icon="✅"
          />
        )
      case 'packing':
        return (
          <TodoSection
            key={section.id}
            section={section}
            onUpdate={updateSection}
            accentColor="amber"
            icon="🎒"
          />
        )
      case 'memo':
        return (
          <MemoSection key={section.id} section={section} onUpdate={updateSection} />
        )
    }
  }

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-100">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 mb-3 transition-colors"
        >
          <ArrowLeft size={13} /> トップへ
        </button>
        <div className="font-bold text-stone-800 text-sm truncate">{itinerary.title}</div>
        <div className="text-xs text-stone-400 mt-0.5 font-mono">{slug}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Cover */}
        <button
          onClick={() => { setActiveSection('cover'); setSidebarOpen(false) }}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors text-left ${
            activeSection === 'cover'
              ? 'bg-indigo-100 text-indigo-700 font-semibold'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Home size={15} /> 表紙
        </button>

        {/* Sections */}
        {allSections.map((s) => (
          <div key={s.id} className="group relative">
            <button
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors text-left pr-8 ${
                activeSection === s.id
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{SECTION_ICONS[s.type]}</span>
              <span className="truncate">{s.title}</span>
            </button>
            <button
              onClick={() => handleDeleteSection(s.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {/* Add section */}
        <div className="relative mt-2">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100 border border-dashed border-stone-300 transition-colors"
          >
            <Plus size={14} /> セクションを追加
          </button>
          {showAddMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-20 w-44">
              {([
                { type: 'schedule' as SectionType, label: '📅 スケジュール' },
                { type: 'todo' as SectionType, label: '✅ TODOリスト' },
                { type: 'packing' as SectionType, label: '🎒 持ち物リスト' },
                { type: 'memo' as SectionType, label: '📝 メモ' },
              ]).map((o) => (
                <button
                  key={o.type}
                  onClick={() => handleAddSection(o.type)}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share */}
      <div className="p-3 border-t border-stone-100">
        <button
          onClick={copyUrl}
          className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'URLをコピーしました' : 'URLをコピー'}
        </button>
      </div>
    </nav>
  )

  const activeSectionData = allSections.find((s) => s.id === activeSection)

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-200 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <span className="font-bold text-stone-800">🗺️ 旅のしおり</span>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 bg-white border-b border-stone-200 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-stone-600">
            <Menu size={22} />
          </button>
          <span className="font-bold text-stone-800 text-sm truncate max-w-[160px]">{itinerary.title}</span>
          <button onClick={refresh} className={syncing ? 'animate-spin text-indigo-400' : 'text-stone-400'}>
            <RefreshCw size={16} />
          </button>
        </header>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-stone-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <LayoutList size={15} />
            <span>{activeSectionData ? `${SECTION_ICONS[activeSectionData.type]} ${activeSectionData.title}` : '🏠 表紙'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className={`text-xs flex items-center gap-1 text-stone-400 hover:text-indigo-500 transition-colors ${syncing ? 'animate-spin' : ''}`}
              title="最新データを取得"
            >
              <RefreshCw size={13} />
            </button>
            <div className="flex items-center gap-1 text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              リアルタイム同期
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-8">
            {/* Cover is always shown at top */}
            {(activeSection === 'cover' || !activeSectionData) && (
              <CoverSection
                itinerary={itinerary}
                onUpdate={(patch) => setItinerary((prev) => ({ ...prev, ...patch }))}
              />
            )}

            {/* Active section content */}
            {activeSectionData && renderSection(activeSectionData)}

            {/* Empty state */}
            {activeSection === 'cover' && allSections.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✈️</div>
                <h2 className="text-lg font-bold text-stone-700 mb-2">セクションを追加しましょう</h2>
                <p className="text-stone-400 text-sm mb-6">左のサイドバーから「セクションを追加」をクリック</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {([
                    { type: 'schedule' as SectionType, label: '📅 スケジュール' },
                    { type: 'todo' as SectionType, label: '✅ TODOリスト' },
                    { type: 'packing' as SectionType, label: '🎒 持ち物リスト' },
                    { type: 'memo' as SectionType, label: '📝 メモ' },
                  ]).map((o) => (
                    <button
                      key={o.type}
                      onClick={() => handleAddSection(o.type)}
                      className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex bg-white border-t border-stone-200 flex-shrink-0">
          <button
            onClick={() => setActiveSection('cover')}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${activeSection === 'cover' ? 'text-indigo-600' : 'text-stone-400'}`}
          >
            <Home size={18} />
            <span>表紙</span>
          </button>
          {allSections.slice(0, 3).map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${activeSection === s.id ? 'text-indigo-600' : 'text-stone-400'}`}
            >
              <span className="text-base leading-none">{SECTION_ICONS[s.type]}</span>
              <span className="truncate w-full text-center">{s.title.slice(0, 4)}</span>
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5 text-stone-400"
          >
            <LayoutList size={18} />
            <span>メニュー</span>
          </button>
        </nav>
      </main>
    </div>
  )
}
