'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Lock, Loader2, Copy, Check } from 'lucide-react'
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
    title: '',
    destination: '',
    description: '',
    start_date: '',
    end_date: '',
    password: '',
    passwordConfirm: '',
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('タイトルを入力してください'); return }
    if (!form.password) { setError('パスワードを入力してください'); return }
    if (form.password !== form.passwordConfirm) { setError('パスワードが一致しません'); return }
    if (form.password.length < 4) { setError('パスワードは4文字以上にしてください'); return }

    setLoading(true)
    const result = await createItinerary({
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">しおりを作成しました！</h1>
          <p className="text-stone-500 mb-6 text-sm">以下のURLとパスワードを仲間に共有しましょう</p>

          <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-left">
            <div className="text-xs text-indigo-600 font-semibold mb-1">しおりのURL</div>
            <div className="font-mono text-sm text-stone-700 break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/{createdSlug}
            </div>
            <div className="text-xs text-stone-500 mt-1">しおりID: <span className="font-mono font-bold">{createdSlug}</span></div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
            <div className="text-xs text-amber-600 font-semibold mb-1">パスワード</div>
            <div className="font-mono text-sm text-stone-700">{form.password}</div>
            <div className="text-xs text-stone-500 mt-1">※ パスワードは大切に保管してください</div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={copyUrl}
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'コピーしました！' : 'URLをコピー'}
            </button>
            <button
              onClick={() => router.push(`/${createdSlug}`)}
              className="w-full py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
            >
              しおりを開く →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> トップに戻る
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-white">
            <h1 className="text-xl font-bold">🗺️ 新しいしおりを作る</h1>
            <p className="text-white/70 text-sm mt-1">旅のタイトルと基本情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                しおりのタイトル <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="例: 沖縄旅行 2025夏"
                maxLength={50}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800 placeholder-stone-400"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                <MapPin size={13} className="inline mr-1" />目的地
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => update('destination', e.target.value)}
                placeholder="例: 沖縄県那覇市"
                maxLength={50}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800 placeholder-stone-400"
              />
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                <Calendar size={13} className="inline mr-1" />日程
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update('start_date', e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800 text-sm"
                />
                <span className="text-stone-400 text-sm">〜</span>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => update('end_date', e.target.value)}
                  min={form.start_date}
                  className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                一言メモ
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="旅のコンセプトや一言メモ"
                rows={2}
                maxLength={200}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800 placeholder-stone-400 resize-none"
              />
            </div>

            {/* Password */}
            <div className="border-t border-stone-100 pt-5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-3">
                <Lock size={14} className="text-indigo-500" />
                共有パスワード設定 <span className="text-rose-500">*</span>
              </div>
              <p className="text-xs text-stone-400 mb-3">このパスワードを知っている人だけがしおりを見たり編集できます</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="パスワード（4文字以上）"
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800"
                />
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => update('passwordConfirm', e.target.value)}
                  placeholder="パスワード（確認）"
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> 作成中...</>
              ) : (
                '🗺️ しおりを作成する'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
