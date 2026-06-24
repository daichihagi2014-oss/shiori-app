'use client'

import { useState } from 'react'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { verifyPassword } from '@/lib/db'

interface Props {
  slug: string
  title?: string
  onSuccess: () => void
}

export default function PasswordGate({ slug, title, onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')

    const ok = await verifyPassword(slug, password)
    setLoading(false)

    if (ok) {
      sessionStorage.setItem(`shiori_auth_${slug}`, 'true')
      onSuccess()
    } else {
      setError('パスワードが違います')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-stone-800">
            {title ? `「${title}」` : 'このしおり'}にアクセス
          </h1>
          <p className="text-stone-500 text-sm mt-1">パスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              autoFocus
              className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-stone-800"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            {loading ? '確認中...' : 'しおりを開く'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-4">
          しおりのIDは <span className="font-mono font-bold text-stone-600">{slug}</span>
        </p>
      </div>
    </div>
  )
}
