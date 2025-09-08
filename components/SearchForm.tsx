'use client'

import { useState, useRef, useEffect } from 'react'
import { z } from 'zod'
import clsx from 'clsx'

const schema = z.object({
  query: z.string().min(1, '请输入搜索关键词'),
  language: z.string().optional().default(''),
  stars: z.string().optional().default(''),
})

type SearchFormProps = {
  onSubmit: (data: { query: string; language: string; stars: string }) => void
  disabled: boolean
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB',
  'Shell', 'PowerShell', 'HTML', 'CSS', 'Vue', 'React', 'Angular',
  'Svelte', 'Solid', 'Elixir', 'Clojure', 'Haskell', 'OCaml', 'F#',
  'Lua', 'Perl', 'C', 'Objective-C', 'Assembly', 'Dockerfile', 'YAML',
  'JSON', 'Markdown', 'TeX', 'Jupyter Notebook', 'Vim Script', 'Emacs Lisp'
]

export default function SearchForm({ onSubmit, disabled }: SearchFormProps) {
  const [form, setForm] = useState({ language: '', stars: '' })
  const [queryTags, setQueryTags] = useState<string[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
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

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const removeLanguage = (language: string) => {
    setSelectedLanguages(prev => prev.filter(l => l !== language))
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
      language: selectedLanguages.join(' ')
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
    <div className="card p-5 relative z-10">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 第一行：筛选条件 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-300 mb-1">语言 language</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={disabled}
                className="input text-left flex items-center justify-between"
              >
                <span className={selectedLanguages.length === 0 ? 'text-gray-400' : 'text-white'}>
                  {selectedLanguages.length === 0 ? '选择编程语言' : `${selectedLanguages.length} 种语言已选择`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {LANGUAGES.map((lang) => (
                        <label key={lang} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLanguages.includes(lang)}
                            onChange={() => toggleLanguage(lang)}
                            disabled={disabled}
                            className="rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-white">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 已选择的语言标签 */}
            {selectedLanguages.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedLanguages.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-md">
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="text-emerald-600 hover:text-emerald-800"
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Star 数 stars</label>
            <input 
              className="input" 
              value={form.stars} 
              onChange={(e) => setForm({ ...form, stars: e.target.value })} 
              placeholder=">=100" 
              disabled={disabled} 
            />
          </div>
        </div>
        
        {/* 第二行：关键词和按钮 */}
        <div className="flex gap-3">
          <div className="flex-1">
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
                className="flex-1 min-w-[120px] border-0 outline-none text-sm bg-transparent text-white placeholder:text-gray-400"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                onKeyDown={handleQueryKeyDown}
                placeholder={queryTags.length === 0 ? "输入关键词，按回车添加" : "继续添加..."}
                disabled={disabled}
              />
            </div>
            {errors.query && <p className="text-red-400 text-xs mt-1">{errors.query}</p>}
          </div>
          <div className="flex flex-col justify-end">
            <button className="btn-primary h-10" disabled={disabled} type="submit">开始分析</button>
          </div>
        </div>
      </form>
    </div>
  )
}
