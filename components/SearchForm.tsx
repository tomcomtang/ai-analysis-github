'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { z } from 'zod'
import clsx from 'clsx'
import StageBar from './StageBar'

const schema = z.object({
  query: z.string().min(1, '请输入搜索关键词'),
  language: z.string().optional().default(''),
  stars: z.string().optional().default(''),
  aiFilter: z.string().optional().default(''),
})

type SearchFormProps = {
  onSubmit: (data: { query: string; language: string; stars: string; aiFilter: string }) => void
  disabled: boolean
  onFormDataChange?: (formData: { query: string; language: string; stars: string; aiFilter: string }) => void
  stage?: 'idle' | 'searching' | 'analyzing' | 'generating' | 'done' | 'error'
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB',
  'Shell', 'PowerShell', 'HTML', 'CSS', 'Vue', 'React', 'Angular',
  'Svelte', 'Solid', 'Elixir', 'Clojure', 'Haskell', 'OCaml', 'F#',
  'Lua', 'Perl', 'C', 'Objective-C', 'Assembly', 'Dockerfile', 'YAML',
  'JSON', 'Markdown', 'TeX', 'Jupyter Notebook', 'Vim Script', 'Emacs Lisp'
]

export default function SearchForm({ onSubmit, disabled, onFormDataChange, stage }: SearchFormProps) {
  const [form, setForm] = useState({ language: '', stars: '', aiFilter: '' })
  const [queryTags, setQueryTags] = useState<string[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('TypeScript')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showAiFilterModal, setShowAiFilterModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 监听表单数据变化
  useEffect(() => {
    notifyFormDataChange()
  }, [queryTags, selectedLanguage, form])

  const addQueryTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !queryTags.includes(trimmed)) {
      setQueryTags([...queryTags, trimmed])
      setCurrentQuery('')
    }
  }

  const removeQueryTag = (index: number) => {
    setQueryTags(queryTags.filter((_, i) => i !== index))
  }

  const handleQueryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addQueryTag(currentQuery)
    }
  }

  const selectLanguage = (language: string) => {
    setSelectedLanguage(language)
    setShowLanguageDropdown(false)
  }

  // AI过滤弹窗相关函数
  const openAiFilterModal = () => {
    setShowAiFilterModal(true)
  }

  const closeAiFilterModal = () => {
    setShowAiFilterModal(false)
  }

  const saveAiFilter = () => {
    closeAiFilterModal()
    notifyFormDataChange()
  }

  // 通知父组件表单数据变化
  const notifyFormDataChange = () => {
    const formData = { 
      ...form, 
      query: queryTags.join(' '),
      language: selectedLanguage
    }
    onFormDataChange?.(formData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (queryTags.length === 0) {
      setErrors({ query: '请输入至少一个关键词' })
      return
    }
    
    const formData = { 
      ...form, 
      query: queryTags.join(' '),
      language: selectedLanguage
    }
    const parse = schema.safeParse(formData)
    if (!parse.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parse.error.issues) {
        const key = issue.path.join('.')
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit(parse.data)
  }

  return (
    <div className="card p-5 relative z-0">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 单行布局：所有筛选条件 */}
        <div className="flex gap-3 items-end">
          {/* 语言选择 */}
          <div className="relative w-48" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-300 mb-1">语言 language</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={disabled}
                className="input text-left flex items-center justify-between"
              >
                <span className={selectedLanguage ? 'text-white' : 'text-gray-400'}>
                  {selectedLanguage || '选择编程语言'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute z-40 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => selectLanguage(lang)}
                          disabled={disabled}
                          className={`p-2 text-sm rounded cursor-pointer transition-colors ${
                            selectedLanguage === lang
                              ? 'bg-emerald-600 text-white'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Star数输入 */}
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-300 mb-1">Star 数 stars</label>
            <input 
              className="input" 
              value={form.stars} 
              onChange={(e) => setForm({ ...form, stars: e.target.value })} 
              placeholder=">=100" 
              disabled={disabled} 
            />
          </div>

          {/* 关键词输入 */}
          <div className="w-64">
            <label className="block text-xs font-medium text-gray-300 mb-1">关键词 query</label>
            <div className={clsx('h-10 border border-gray-600 rounded-lg bg-gray-800 p-2 flex flex-wrap gap-1', errors.query && 'ring-2 ring-red-500 border-red-500')}>
              {queryTags.map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-md">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeQueryTag(index)}
                    className="text-emerald-600 hover:text-emerald-800"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[80px] border-0 outline-none text-sm bg-transparent text-white placeholder:text-gray-400"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                onKeyDown={handleQueryKeyDown}
                placeholder={queryTags.length === 0 ? "输入关键词，按回车添加" : "继续添加..."}
                disabled={disabled}
              />
            </div>
            {errors.query && <p className="text-red-400 text-xs mt-1">{errors.query}</p>}
          </div>

          {/* AI过滤规则 */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-300 mb-1">AI过滤规则 AI Filter</label>
            <input 
              className="input" 
              value={form.aiFilter} 
              onChange={(e) => setForm({ ...form, aiFilter: e.target.value })} 
              placeholder="例如：只显示静态部署项目、排除需要数据库的项目等" 
              disabled={disabled} 
              readOnly
              onClick={openAiFilterModal}
            />
          </div>

          {/* 开始分析按钮 */}
          <div>
            <button className="btn-primary h-10" disabled={disabled} type="submit">开始分析</button>
          </div>
        </div>
        
        {/* AI过滤规则帮助文本 */}
        {form.aiFilter && (
          <div className="text-xs text-gray-400">
            💡 输入AI过滤规则，帮助AI更精准地筛选和排序项目
          </div>
        )}
      </form>
      
      {/* 步骤组件 */}
      {stage && stage !== 'idle' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <StageBar stage={stage} />
        </div>
      )}

      {/* AI过滤规则弹窗 */}
      {showAiFilterModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={closeAiFilterModal}
        >
          <div 
            className="bg-gray-800 rounded-xl p-8 w-full max-w-6xl h-[80vh] border border-gray-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">AI过滤规则设置</h3>
              <button
                onClick={closeAiFilterModal}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-lg font-medium text-gray-300">
                    过滤规则描述
                  </label>
                  <span className="text-sm text-gray-400">
                    最多500字
                  </span>
                </div>
                <textarea
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-base leading-relaxed"
                  value={form.aiFilter}
                  onChange={(e) => setForm({ ...form, aiFilter: e.target.value })}
                  placeholder="请详细描述您希望AI如何筛选和排序项目，例如：&#10;&#10;• 只显示静态部署项目（不需要服务器）&#10;• 排除需要数据库或API的项目&#10;• 优先显示有预览链接的项目&#10;• 只显示前端框架项目（React、Vue、Angular等）&#10;• 排除后端项目，只显示纯前端项目"
                  maxLength={500}
                />
              </div>
              
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-emerald-300">💡 使用建议</span>
                  <span className="text-xs text-emerald-200">尽量不要超过500字</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8 pt-6">
              <button
                onClick={closeAiFilterModal}
                className="px-6 py-3 text-base border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveAiFilter}
                className="px-6 py-3 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
