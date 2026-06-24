'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Lock, Loader2, Copy, Check, Link } from 'lucide-react'
import { createItinerary } from '@/lib/db'

type Step = 'form' | 'done'

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdSlug, setCreatedSlug] = useState('')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    slug: '',
    title: '',
    destination: '',
    description: '',
    start_date: '',
    end_date: '',
    password: '',
    passwordConfirm: '',
  })

  function update(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function validateSlug(v: string): string | null {
    if (!v) return null
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(v) && v.length > 1) return '半角英小文字・数字・ハイフンのみ使用可（先頭と末尾は英数字）'
    if (v.length < 2) return '2文字以上で入力してください'
    if (v.length > 30) return '30文字以内で入力してください'
    return null
  }

  const slugError = form.slug ? validateSlug(form.slug) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('タイトルを入力してください'); return }
    if (!form.password) { setError('パスワードを入力してください'); return }
    if (form.password !== form.passwordConfirm) { setError('パスワードが一致しません'); return }
    if (form.password.length < 4) { setError('パスワードは4文字以上にしてください'); return }
    if (form.slug && slugError) { setError(slugError); return }

    setLoading(true)
    const result = await createItinerary({
      slug: form.slug.trim() || undefined,
      title: form.title.trim(),
      destination: form.destination.trim(),
      description: form.description.trim(),
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      password: form.password,
    })
    setLoading(false)

    if ('error' in result) {
      setError('作成に失敗しました: ' + result.error)
      return
    }

    setCreatedSlug(result.slug)
    setStep('done')
  }

  function copyUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/${createdSlug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="sf-card p-8 max-w-md w-full text-center animate-scale-in">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="sf-title-2 mb-2">しおりを作成しました！</h1>
          <p className="sf-footnote mb-6">URLとパスワードを仲間に共有しましょう</p>

          <div className="rounded-2xl p-4 mb-3 text-left" style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--blue)' }}>しおりのURL</div>
            <div className="font-mono text-sm break-all" style={{ color: 'var(--label)' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/{createdSlug}
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--orange)' }}>パスワード</div>
            <div className="font-mono text-sm" style={{ color: 'var(--label)' }}>{form.password}</div>
            <div className="sf-caption mt-1">パスワードは大切に保管してください</div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={copyUrl} className="sf-btn-primary flex items-center justify-center gap-2 w-full py-3">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピーしました！' : 'URLをコピー'}
            </button>
            <button
              onClick={() => router.push(`/${createdSlug}`)}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-colors"
              style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
            >
              しおりを開く →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 mb-6 text-sm transition-colors"
          style={{ color: 'var(--blue)' }}
        >
          <ArrowLeft size={14} /> トップに戻る
        </button>

        <div className="sf-card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' }}>
            <h1 className="text-xl font-bold text-white">🗺️ 新しいしおりを作る</h1>
            <p className="text-white/70 text-sm mt-0.5">旅の基本情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block sf-subhead font-semibold mb-1.5" style={{ color: 'var(--label)' }}>
                しおりのタイトル <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="例: 沖縄旅行 2025夏"
                maxLength={50}
                className="sf-input"
              />
            </div>

            {/* Custom slug */}
            <div>
              <label className="block sf-subhead font-semibold mb-1" style={{ color: 'var(--label)' }}>
                <Link size={12} className="inline mr-1" />URLのID（任意）
              </label>
              <p className="sf-caption mb-1.5">空白の場合はランダムIDが自動生成されます</p>
              <div className="flex items-center gap-1 rounded-xl px-3 py-2.5" style={{ border: `1.5px solid ${slugError ? 'var(--red)' : 'var(--separator-opaque)'}`, background: 'var(--bg-elevated)' }}>
                <span className="sf-footnote shrink-0" style={{ color: 'var(--label-tertiary)' }}>…/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="okinawa-2025"
                  maxLength={30}
                  className="flex-1 text-sm focus:outline-none bg-transparent"
                  style={{ color: 'var(--label)' }}
                />
              </div>
              {slugError && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{slugError}</p>}
              {form.slug && !slugError && (
                <p className="sf-caption mt-1">URL: <span className="font-mono" style={{ color: 'var(--blue)' }}>/{form.slug}</span></p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block sf-subhead font-semibold mb-1.5" style={{ color: 'var(--label)' }}>
                <MapPin size={12} className="inline mr-1" />目的地
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={e => update('destination', e.target.value)}
                placeholder="例: 沖縄県那覇市"
                maxLength={50}
                className="sf-input"
              />
            </div>

            {/* Dates */}
            <div>
              <label className="block sf-subhead font-semibold mb-1.5" style={{ color: 'var(--label)' }}>
                <Calendar size={12} className="inline mr-1" />日程
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => update('start_date', e.target.value)}
                  className="sf-input text-sm py-2.5"
                  style={{ flex: 1 }}
                />
                <span className="sf-footnote">〜</span>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => update('end_date', e.target.value)}
                  min={form.start_date}
                  className="sf-input text-sm py-2.5"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block sf-subhead font-semibold mb-1.5" style={{ color: 'var(--label)' }}>一言メモ</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="旅のコンセプトや一言メモ"
                rows={2}
                maxLength={200}
                className="sf-input resize-none"
              />
            </div>

            {/* Password */}
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--separator-opaque)' }}>
              <div className="flex items-center gap-1.5 sf-subhead font-semibold" style={{ color: 'var(--label)' }}>
                <Lock size={13} style={{ color: 'var(--blue)' }} />
                共有パスワード <span style={{ color: 'var(--red)' }}>*</span>
              </div>
              <p className="sf-caption">このパスワードを知っている人だけが編集できます</p>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="パスワード（4文字以上）"
                className="sf-input"
              />
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={e => update('passwordConfirm', e.target.value)}
                placeholder="パスワード（確認）"
                className="sf-input"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: 'var(--red)' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!slugError}
              className="sf-btn-primary w-full flex items-center justify-center gap-2"
              style={{ padding: '14px' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> 作成中...</> : '🗺️ しおりを作成する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
