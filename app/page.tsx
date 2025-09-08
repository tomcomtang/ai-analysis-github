'use client'

import { useRef, useState } from 'react'
import SearchForm from '../components/SearchForm'
import ResultsTable from '../components/ResultsTable'
import StageBar from '../components/StageBar'

type Stage = 'idle' | 'searching' | 'analyzing' | 'generating' | 'done' | 'error'

type EventPayload = {
  type: 'stage' | 'result' | 'error' | 'end' | 'total_count'
  stage?: Stage
  message?: string
  result?: any
  total_count?: number
}

export default function HomePage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [allData, setAllData] = useState<any[]>([]) // 存储所有数据
  const [running, setRunning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage] = useState(5) // 固定每页5条
  const [showStaticOnly, setShowStaticOnly] = useState(false) // 是否只显示静态部署项目
  const esRef = useRef<EventSource | null>(null)

  // 计算当前页显示的数据
  const startIndex = (currentPage - 1) * perPage
  const endIndex = startIndex + perPage
  const currentPageData = allData.slice(startIndex, endIndex)

  const disabled = running

  const handleSearch = (formData: { query: string; language: string; stars: string }) => {
    setAllData([])
    setCurrentPage(1)
    setStage('searching')
    setRunning(true)

    const qs = new URLSearchParams({
      ...formData,
      per_page: '100', // GitHub API 单页最多100条
      page: '1'
    })
    
    const es = new EventSource(`/api/search?${qs.toString()}`)
    esRef.current = es
    es.onmessage = (ev) => {
      try {
        const data: EventPayload = JSON.parse(ev.data)
        if (data.type === 'stage') {
          if (data.stage) setStage(data.stage)
        } else if (data.type === 'result' && data.result) {
          setAllData((r) => [...r, data.result])
        } else if (data.type === 'total_count' && data.total_count) {
          setTotalCount(data.total_count)
        } else if (data.type === 'error') {
          setStage('error')
        } else if (data.type === 'end') {
          setStage('done')
          es.close()
          setRunning(false)
        }
      } catch (err) {
        console.error('bad event', err)
      }
    }
    es.onerror = () => {
      setStage('error')
      setRunning(false)
      es.close()
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > Math.ceil(allData.length / perPage) || running) return
    setCurrentPage(page)
  }

  const stop = () => {
    esRef.current?.close()
    setRunning(false)
  }

  const toggleStaticFilter = () => {
    setShowStaticOnly(!showStaticOnly)
    setCurrentPage(1) // 重置到第一页
  }

  return (
    <div className="space-y-8">
      <SearchForm onSubmit={handleSearch} disabled={disabled} />
      
      {running && (
        <div className="flex justify-center">
          <button onClick={stop} className="btn-secondary">停止搜索</button>
        </div>
      )}

      <StageBar stage={stage} />

      <ResultsTable 
        rows={allData}
        currentPage={currentPage}
        totalCount={allData.length}
        perPage={perPage}
        onPageChange={handlePageChange}
        running={running}
        showStaticOnly={showStaticOnly}
        onToggleStaticFilter={toggleStaticFilter}
      />
    </div>
  )
}