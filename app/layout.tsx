import './globals.css'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-white">
        <header className="sticky top-0 z-10 border-b border-gray-700/40 bg-gray-900/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white grid place-items-center font-bold">AI</div>
              <div>
                <h1 className="text-xl font-semibold text-white">AI GitHub 分析器</h1>
                <p className="text-xs text-gray-400">配置搜索条件 · 实时查看阶段与结果</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-6">
          {children}
        </main>
      </body>
    </html>
  )
}


