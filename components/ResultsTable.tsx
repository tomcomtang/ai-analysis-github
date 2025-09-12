'use client'

import { useState } from 'react'
import clsx from 'clsx'

type ComprehensiveAnalysis = {
  readme: any
  about: any
  fileStructure: any
  combinedPreviewUrls: string[]
  combinedConfidence: number
  finalAssessment: {
    isStaticDeploy: boolean
    hasPreviewUrl: boolean
    hasDeployButtons: boolean
    deployPlatforms: string[]
    confidence: number
    summary: string
  }
}

type Repo = {
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  html_url: string
  updated_at: string
  owner: string
  owner_avatar: string
  owner_html_url: string
  comprehensive_analysis?: ComprehensiveAnalysis | null
}

type ResultsTableProps = {
  rows: Repo[]
  currentPage: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  running: boolean
  showStaticOnly?: boolean
  onToggleStaticFilter?: () => void
  currentDataRange?: { start: number; end: number }
  loadingMore?: boolean
  githubTotalCount?: number
  onLoadMore?: () => void
}

export default function ResultsTable({ 
  rows, 
  currentPage, 
  totalCount, 
  perPage, 
  onPageChange, 
  running,
  showStaticOnly = false,
  onToggleStaticFilter,
  currentDataRange,
  loadingMore = false,
  githubTotalCount = 0,
  onLoadMore
}: ResultsTableProps) {

  // 筛选静态部署项目 - 只显示静态项目，过滤需要接口服务的项目
  const filteredRows = showStaticOnly 
    ? rows.filter(repo => {
        const analysis = repo.comprehensive_analysis
        if (!analysis) return false
        
        // 必须是静态项目（不需要接口服务）
        const isStatic = analysis.finalAssessment.isStaticDeploy
        
        // 排除需要接口服务的项目特征
        const hasBackendFeatures = 
          repo.description?.toLowerCase().includes('api') ||
          repo.description?.toLowerCase().includes('server') ||
          repo.description?.toLowerCase().includes('backend') ||
          repo.description?.toLowerCase().includes('database') ||
          repo.description?.toLowerCase().includes('mysql') ||
          repo.description?.toLowerCase().includes('postgresql') ||
          repo.description?.toLowerCase().includes('mongodb') ||
          repo.description?.toLowerCase().includes('redis') ||
          repo.language === 'Go' ||
          repo.language === 'Java' ||
          repo.language === 'C#' ||
          repo.language === 'Python' ||
          repo.language === 'PHP' ||
          repo.language === 'Ruby'
        
        return isStatic && !hasBackendFeatures && analysis.finalAssessment.confidence > 0.3
      })
    : rows

  const totalPages = Math.ceil(filteredRows.length / perPage)
  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, filteredRows.length)
  
  // 获取当前页的数据
  const currentPageData = filteredRows.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <>

      <div className="card">
        <div className="overflow-hidden rounded-xl">
          <table className="w-full text-sm table-fixed" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-800/50">
              <tr className="text-gray-300 h-12">
                <Th style={{ width: '20%' }}>仓库</Th>
                <Th style={{ width: '12%' }}>作者</Th>
                <Th style={{ width: '18%' }}>描述</Th>
                <Th style={{ width: '8%' }}>语言</Th>
                <Th style={{ width: '10%' }}>AI分析</Th>
                <Th style={{ width: '15%' }}>预览地址</Th>
                <Th style={{ width: '8%' }}>Stars</Th>
                <Th style={{ width: '9%' }}>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentPageData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-800/50 h-16">
                  <Td>
                    <a 
                      className="text-emerald-400 hover:underline font-medium block truncate" 
                      href={r.html_url} 
                      target="_blank" 
                      rel="noreferrer"
                      title={r.full_name}
                    >
                      {r.full_name}
                    </a>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <img 
                        src={r.owner_avatar} 
                        alt={r.owner}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <a 
                        href={r.owner_html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline text-sm truncate"
                        title={r.owner}
                      >
                        {r.owner}
                      </a>
                    </div>
                  </Td>
                  <Td className="text-gray-300">
                    <div className="truncate" title={r.description || ''}>
                      {r.description || '无描述'}
                    </div>
                  </Td>
                  <Td>
                    <span className="badge border-emerald-200 text-emerald-300 bg-emerald-900/30 text-xs">{r.language || 'N/A'}</span>
                  </Td>
                  <Td>
                    {r.comprehensive_analysis ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <div className={clsx(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            r.comprehensive_analysis.finalAssessment.isStaticDeploy ? 'bg-emerald-500' : 'bg-gray-500'
                          )} />
                          <span className="text-xs text-gray-300 truncate">
                            {r.comprehensive_analysis.finalAssessment.isStaticDeploy ? '可运行' : '非静态'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {Math.round(r.comprehensive_analysis.finalAssessment.confidence * 100)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">分析中...</span>
                    )}
                  </Td>
                  <Td>
                    {r.comprehensive_analysis?.combinedPreviewUrls && r.comprehensive_analysis.combinedPreviewUrls.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {r.comprehensive_analysis.combinedPreviewUrls.slice(0, 1).map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline text-xs truncate"
                            title={url}
                          >
                            {url.replace(/^https?:\/\//, '')}
                          </a>
                        ))}
                        {r.comprehensive_analysis.combinedPreviewUrls.length > 1 && (
                          <span className="text-xs text-gray-500">
                            +{r.comprehensive_analysis.combinedPreviewUrls.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">无预览</span>
                    )}
                  </Td>
                  <Td className="font-medium text-white text-center">{r.stargazers_count?.toLocaleString() || 0}</Td>
                  <Td>
                    <a
                      href={r.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1 rounded hover:bg-emerald-900/30 inline-block"
                    >
                      访问
                    </a>
                  </Td>
                </tr>
              ))}
              {currentPageData.length === 0 && (
                <tr>
                  <Td colSpan={8}>
                    <div className="text-center text-gray-400 py-10">
                      {showStaticOnly ? '暂无符合条件的可直接运行/部署项目' : '暂无数据'}
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 合并的数据范围和分页信息 */}
      {filteredRows.length > 0 && (
        <div className="card p-4 bg-emerald-900/20 border-emerald-500/30">
          <div className="flex items-center justify-between">
            {/* 左侧：数据范围信息 */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-emerald-300">
                {loadingMore ? (
                  <span>🔄 正在加载更多数据...</span>
                ) : (
                  <>
                    📊 当前显示从GitHub拉取的第 <span className="font-semibold">{currentDataRange?.start || 0}</span> 到第 <span className="font-semibold">{currentDataRange?.end || 0}</span> 条结果
                    {githubTotalCount > 0 && (
                      <span className="ml-2">（共 {githubTotalCount.toLocaleString()} 条结果）</span>
                    )}
                  </>
                )}
              </div>
              
              {/* 加载更多按钮 */}
              {onLoadMore && (
                <button 
                  onClick={onLoadMore}
                  disabled={loadingMore || running || (currentDataRange?.end || 0) >= githubTotalCount}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 py-1"
                >
                  {loadingMore ? '加载中...' : '加载更多1000条'}
                </button>
              )}
            </div>
            
            {/* 右侧：简化的分页控件 */}
            <div className="flex items-center gap-2">
              {/* 首页 */}
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1 || running}
                className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                首页
              </button>
              
              {/* 上一页 */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || running}
                className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                上一页
              </button>
              
              {/* 当前页 */}
              <span className="px-3 py-1 text-xs bg-emerald-600 text-white rounded">
                {currentPage}
              </span>
              
              {/* 下一页 */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || running}
                className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                下一页
              </button>
              
              {/* 末页 */}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages || running}
                className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                末页
              </button>
              
              {/* 快速跳转 */}
              <div className="flex items-center gap-1 ml-3">
                <span className="text-xs text-gray-400">跳转</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  defaultValue={currentPage}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const targetPage = parseInt((e.target as HTMLInputElement).value)
                      if (targetPage >= 1 && targetPage <= totalPages) {
                        onPageChange(targetPage)
                      }
                    }
                  }}
                  className="w-12 px-1 py-1 text-xs border border-gray-600 rounded bg-gray-800 text-white text-center"
                  disabled={running}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-3 py-2 whitespace-nowrap">{children}</th>
}

function Td({ children, colSpan }: { children: React.ReactNode, colSpan?: number }) {
  return <td colSpan={colSpan} className="px-3 py-2 align-top max-w-[32rem]">{children}</td>
}
