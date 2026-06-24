import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="text-center">
        <div className="text-7xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">しおりが見つかりませんでした</h1>
        <p className="text-stone-500 text-sm mb-6">URLが間違っているか、しおりが削除された可能性があります</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  )
}
