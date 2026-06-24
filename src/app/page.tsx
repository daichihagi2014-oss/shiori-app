'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Lock, Image, CheckSquare, Calendar, ArrowRight, BookOpen, MapPin } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [openSlug, setOpenSlug] = useState('')
  const [showOpenForm, setShowOpenForm] = useState(false)

  function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    const slug = openSlug.trim()
    if (slug) router.push(`/${slug}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <span className="font-bold text-lg text-stone-800">旅のしおり</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOpenForm(!showOpenForm)}
              className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              しおりを開く
            </button>
            <button
              onClick={() => router.push('/create')}
              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            >
              新規作成
            </button>
          </div>
        </div>
        {showOpenForm && (
          <div className="border-t border-stone-200 bg-white">
            <form onSubmit={handleOpen} className="max-w-6xl mx-auto px-4 py-3 flex gap-2">
              <input
                type="text"
                value={openSlug}
                onChange={(e) => setOpenSlug(e.target.value)}
                placeholder="しおりのID（例: abc12345）を入力"
                className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                開く
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="text-6xl md:text-8xl mb-6">✈️</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            旅の思い出を、<br className="sm:hidden" />みんなで作ろう。
          </h1>
          <p className="text-base md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            URLとパスワードで共有できる旅のしおり。<br />
            スケジュール・TODO・持ち物リストをスマホ・PCどこからでも共同編集。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/create')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-full hover:bg-indigo-50 transition-all shadow-lg text-base"
            >
              🗺️ しおりを作る
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { setShowOpenForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/60 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-base"
            >
              <BookOpen size={18} />
              しおりを開く
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#fafaf9"/>
          </svg>
        </div>
      </section>

      {/* Sample itinerary preview */}
      <section className="max-w-4xl mx-auto px-4 -mt-2 mb-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-4 text-white">
            <h3 className="font-bold text-lg">🌸 京都・奈良 春旅 2泊3日</h3>
            <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> 4月10日(木) 〜 4月12日(土) • 3名参加
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2 text-indigo-700 font-semibold text-xs">
                <Calendar size={13} /> 1日目のスケジュール
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600">
                <li>🚄 09:30 新幹線で京都へ</li>
                <li>🍜 12:00 錦市場でランチ</li>
                <li>⛩️ 14:00 伏見稲荷大社</li>
                <li>🏨 18:00 宿チェックイン</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2 text-green-700 font-semibold text-xs">
                <CheckSquare size={13} /> TODOリスト
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600">
                <li className="flex items-center gap-1"><span className="text-green-500">✓</span> 新幹線の予約</li>
                <li className="flex items-center gap-1"><span className="text-green-500">✓</span> ホテル予約</li>
                <li className="flex items-center gap-1"><span className="text-stone-300">○</span> 観光プランを決める</li>
                <li className="flex items-center gap-1"><span className="text-stone-300">○</span> レストラン調査</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2 text-amber-700 font-semibold text-xs">
                🎒 持ち物リスト
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600">
                <li className="flex items-center gap-1"><span className="text-green-500">✓</span> 財布・現金</li>
                <li className="flex items-center gap-1"><span className="text-green-500">✓</span> 充電器</li>
                <li className="flex items-center gap-1"><span className="text-stone-300">○</span> 日焼け止め</li>
                <li className="flex items-center gap-1"><span className="text-stone-300">○</span> 折りたたみ傘</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-800 mb-10">
          旅の計画が、もっと楽しくなる
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: <Lock size={22} />, color: 'bg-indigo-100 text-indigo-600', title: 'パスワード保護', desc: 'URLとパスワードでメンバーだけに共有' },
            { icon: <Users size={22} />, color: 'bg-purple-100 text-purple-600', title: 'リアルタイム共同編集', desc: '複数人が同時に編集・チェック可能' },
            { icon: <Calendar size={22} />, color: 'bg-blue-100 text-blue-600', title: 'スケジュール管理', desc: '日付・時間・場所で旅程を詳しく記録' },
            { icon: <CheckSquare size={22} />, color: 'bg-green-100 text-green-600', title: 'TODOリスト', desc: '旅の準備タスクをチェックリストで管理' },
            { icon: <span className="text-xl">🎒</span>, color: 'bg-amber-100 text-amber-700', title: '持ち物リスト', desc: '忘れ物ゼロのための持ち物チェックリスト' },
            { icon: <Image size={22} />, color: 'bg-rose-100 text-rose-600', title: '表紙画像', desc: 'お気に入り写真でしおりの表紙を飾る' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-4 md:p-5 border border-stone-200 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-stone-800 mb-1 text-sm md:text-base">{f.title}</h3>
              <p className="text-stone-500 text-xs md:text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-800 mb-10">
            かんたん3ステップ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', emoji: '✏️', title: 'しおりを作る', desc: 'タイトル・目的地・日程・パスワードを設定して作成' },
              { step: '02', emoji: '🔗', title: 'URLを共有', desc: '発行されたURLとパスワードをメンバーに共有するだけ' },
              { step: '03', emoji: '✈️', title: '一緒に編集', desc: 'みんなでスケジュールやリストをリアルタイム編集' },
            ].map((s) => (
              <div key={s.step} className="relative bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  STEP {s.step}
                </div>
                <div className="text-5xl mb-4 mt-2">{s.emoji}</div>
                <h3 className="font-bold text-stone-800 mb-2">{s.title}</h3>
                <p className="text-stone-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-4">さあ、旅の計画を始めよう</h2>
        <p className="text-stone-500 mb-8">無料・登録不要で今すぐ使えます</p>
        <button
          onClick={() => router.push('/create')}
          className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg text-base"
        >
          🗺️ 無料でしおりを作る
          <ArrowRight size={20} />
        </button>
      </section>

      <footer className="mt-auto border-t border-stone-200 py-6 px-4 text-center text-stone-400 text-sm">
        <p>旅のしおり © 2025 — みんなで作る旅の記録</p>
      </footer>
    </div>
  )
}
