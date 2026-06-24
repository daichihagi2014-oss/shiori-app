'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, Lock, Smartphone, DollarSign, ImageIcon, List } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [showInput, setShowInput] = useState(false)

  function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    if (slug.trim()) router.push(`/${slug.trim()}`)
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', background: '#FAFAF8', minHeight: '100vh' }}>

      {/* ───── Nav ───── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,250,248,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 28px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.04em', color: '#111' }}>旅のしおり</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setShowInput(v => !v)}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#666', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
            >
              しおりを開く
            </button>
            <button
              onClick={() => router.push('/create')}
              style={{ padding: '9px 22px', fontSize: '14px', fontWeight: 700, color: '#fff', background: '#111', borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity .15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              作成する <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {showInput && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
            <form onSubmit={handleOpen} style={{ maxWidth: '1120px', margin: '0 auto', padding: '12px 28px', display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="しおりのIDを入力（例: okinawa-2025）"
                style={{ flex: 1, padding: '10px 16px', fontSize: '14px', border: '1.5px solid #E5E5E5', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', color: '#111', background: '#fff', transition: 'border-color .15s' }}
                onFocus={e => { e.target.style.borderColor = '#111' }}
                onBlur={e => { e.target.style.borderColor = '#E5E5E5' }}
              />
              <button type="submit" style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 700, background: '#111', color: '#fff', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                開く
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ───── Hero ───── */}
      <section style={{ background: '#0E0E0E', position: 'relative', overflow: 'hidden', padding: 'clamp(80px, 12vw, 140px) 28px clamp(100px, 14vw, 160px)' }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '-80px', right: '-120px', width: '720px', height: '720px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px 5px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', marginBottom: '36px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.01em' }}>無料 · 登録不要 · リアルタイム同期</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(3.2rem, 9vw, 7rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.03,
            letterSpacing: '-0.05em',
            margin: '0 0 28px',
          }}>
            一緒に、旅を<br />
            <span style={{ color: '#F59E0B' }}>計画しよう。</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', lineHeight: 1.75, margin: '0 0 52px' }}>
            URLとパスワードで共有できる旅のしおり。<br />スケジュール・費用・持ち物リストをみんなで編集。
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/create')}
              style={{ padding: '16px 36px', fontSize: '16px', fontWeight: 700, background: '#F59E0B', color: '#0E0E0E', borderRadius: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity .15s, transform .12s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              しおりを作る <ArrowRight size={17} />
            </button>
            <button
              onClick={() => { setShowInput(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{ padding: '16px 32px', fontSize: '16px', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: '#fff', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.13)', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            >
              しおりを開く
            </button>
          </div>
        </div>
      </section>

      {/* ───── App preview mock ───── */}
      <section style={{ background: '#F0EEE9', padding: 'clamp(60px, 8vw, 100px) 28px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            {/* Window chrome */}
            <div style={{ background: '#1A1A1A', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '7px' }}>
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#FF5F57' }} />
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#FEBC2E' }} />
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#28C840' }} />
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '7px', padding: '5px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                shiori-app.vercel.app/kyoto-spring
              </div>
            </div>
            {/* App layout */}
            <div style={{ display: 'flex' }}>
              {/* Sidebar */}
              <div style={{ width: '190px', borderRight: '1px solid #F0F0F0', padding: '16px 10px', flexShrink: 0, background: '#FAFAFA' }}>
                <div style={{ padding: '8px 10px 16px', fontSize: '12px', fontWeight: 800, letterSpacing: '-0.02em', color: '#111', borderBottom: '1px solid #F0F0F0', marginBottom: '8px' }}>
                  🌸 京都・春旅 3日間
                </div>
                {[
                  { icon: '🏠', label: '表紙', active: false },
                  { icon: '📅', label: 'スケジュール', active: true },
                  { icon: '✅', label: 'TODOリスト', active: false },
                  { icon: '🎒', label: '持ち物リスト', active: false },
                  { icon: '💴', label: '費用管理', active: false },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: item.active ? 600 : 400, color: item.active ? '#111' : '#AAA', background: item.active ? '#EFEFEF' : 'transparent', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: '24px 28px', overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#BBB', textTransform: 'uppercase', marginBottom: '16px' }}>1日目 · 4月10日（木）</div>
                {[
                  { emoji: '🚄', time: '09:30', title: '新幹線で京都へ', sub: '東京駅 → 京都駅 · 約2h15m' },
                  { emoji: '🍜', time: '12:30', title: '錦市場でランチ', sub: '錦市場 · 事前予約済み' },
                  { emoji: '⛩️', time: '14:00', title: '伏見稲荷大社を散策', sub: '京都市伏見区' },
                  { emoji: '🏨', time: '18:30', title: 'ホテルチェックイン', sub: '京都市中京区 · 2泊' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '11px 14px', borderRadius: '12px', background: i === 2 ? '#FAFAFA' : 'transparent', marginBottom: '2px', border: i === 2 ? '1px solid #F0F0F0' : '1px solid transparent' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>
                      {item.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '3px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#BBB' }}>{item.time} · {item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) 28px', background: '#FAFAF8' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ marginBottom: '64px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: '#F59E0B', textTransform: 'uppercase', margin: '0 0 14px' }}>Features</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 800, color: '#111', letterSpacing: '-0.04em', lineHeight: 1.15, margin: 0 }}>
              旅の計画が、<br />もっとスムーズに。
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #E8E5DF' }}>
            {[
              { icon: <Users size={19} />, title: 'リアルタイム共同編集', desc: 'URLを共有するだけ。仲間全員が同時にしおりを編集できます。' },
              { icon: <Lock size={19} />, title: 'パスワード保護', desc: 'パスワードを知っている人だけがアクセス可能。プライバシーも安心。' },
              { icon: <DollarSign size={19} />, title: '費用管理・按分計算', desc: '旅の費用をまとめ、人数・割合に応じて自動で按分します。' },
              { icon: <Smartphone size={19} />, title: 'スマホ・PC両対応', desc: 'どのデバイスでも快適に。出先のスマホでも使えます。' },
              { icon: <ImageIcon size={19} />, title: '写真添付', desc: '表紙や各スケジュールに写真を添付して、記録に残せます。' },
              { icon: <List size={19} />, title: 'TODO & 持ち物リスト', desc: '旅の準備タスクと持ち物を一元管理。忘れ物ゼロへ。' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', padding: '32px 28px', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF8' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', marginBottom: '20px' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How to use ───── */}
      <section style={{ background: '#0E0E0E', padding: 'clamp(80px, 10vw, 120px) 28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: '#F59E0B', textTransform: 'uppercase', margin: '0 0 14px' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', margin: '0 0 72px' }}>
            3ステップで<br />すぐ使える。
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '48px' }}>
            {[
              { num: '01', title: 'しおりを作成', desc: 'タイトル・日程・パスワードを設定して作成。お好みのURLも設定できます。' },
              { num: '02', title: 'URLを共有', desc: '発行されたURLとパスワードをLINEやメールで仲間に送るだけ。' },
              { num: '03', title: '一緒に編集', desc: 'スケジュール・費用・リストをリアルタイムで共同編集。旅が楽しみになる。' },
            ].map(s => (
              <div key={s.num}>
                <div style={{ fontSize: '72px', fontWeight: 800, color: 'rgba(255,255,255,0.05)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '20px' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section style={{ background: '#FAFAF8', padding: 'clamp(80px, 10vw, 120px) 28px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: '#F59E0B', textTransform: 'uppercase', margin: '0 0 16px' }}>Start for free</p>
        <h2 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800, color: '#111', letterSpacing: '-0.05em', lineHeight: 1.08, margin: '0 0 24px' }}>
          さあ、旅の計画を<br />始めよう。
        </h2>
        <p style={{ fontSize: '16px', color: '#AAA', margin: '0 0 52px' }}>無料・登録不要。今すぐ使えます。</p>
        <button
          onClick={() => router.push('/create')}
          style={{ padding: '18px 52px', fontSize: '17px', fontWeight: 700, background: '#111', color: '#fff', borderRadius: '16px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', transition: 'opacity .15s, transform .12s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          無料でしおりを作る <ArrowRight size={20} />
        </button>
      </section>

      {/* ───── Footer ───── */}
      <footer style={{ background: '#0E0E0E', padding: '32px 28px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>旅のしおり</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>© 2025 — みんなで作る旅の記録</span>
        </div>
      </footer>
    </div>
  )
}
