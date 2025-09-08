'use client'

import { useState } from 'react'
import clsx from 'clsx'

type ReadmeAnalysis = {
  isStaticDeploy: boolean
  hasPreviewUrl: boolean
  hasDeployButtons: boolean
  previewUrls: string[]
  deployPlatforms: string[]
  confidence: number
  summary: string
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
  readme_analysis?: ReadmeAnalysis | null
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
}

export default function ResultsTable({ 
  rows, 
  currentPage, 
  totalCount, 
  perPage, 
  onPageChange, 
  running,
  showStaticOnly = false,
  onToggleStaticFilter
}: ResultsTableProps) {

  // 筛选静态部署项目 - 更严格的条件
  const filteredRows = showStaticOnly 
    ? rows.filter(repo => {
        const analysis = repo.readme_analysis
        if (!analysis) return false
        
        // 必须是静态项目且有预览地址，或者有部署按钮
        return analysis.isStaticDeploy && 
               (analysis.hasPreviewUrl || analysis.hasDeployButtons) &&
               analysis.confidence > 0.3  // 置信度阈值
      })
    : rows

  const totalPages = Math.ceil(filteredRows.length / perPage)
  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, filteredRows.length)
  
  // 获取当前页的数据
  const currentPageData = filteredRows.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <>
      {/* 筛选控制栏 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              显示 {filteredRows.length} 条结果
              {showStaticOnly && ' (可直接运行/部署的静态项目)'}
            </span>
            {onToggleStaticFilter && (
              <button
                onClick={onToggleStaticFilter}
                className={clsx(
                  'px-3 py-1 text-xs rounded transition',
                  showStaticOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                {showStaticOnly ? '显示所有' : '仅可运行项目'}
              </button>
            )}
          </div>
        </div>
      </div>

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
                    {r.readme_analysis ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <div className={clsx(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            r.readme_analysis.isStaticDeploy ? 'bg-emerald-500' : 'bg-gray-500'
                          )} />
                          <span className="text-xs text-gray-300 truncate">
                            {r.readme_analysis.isStaticDeploy ? '可运行' : '非静态'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {Math.round(r.readme_analysis.confidence * 100)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">分析中...</span>
                    )}
                  </Td>
                  <Td>
                    {r.readme_analysis?.previewUrls && r.readme_analysis.previewUrls.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {r.readme_analysis.previewUrls.slice(0, 1).map((url, idx) => (
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
                        {r.readme_analysis.previewUrls.length > 1 && (
                          <span className="text-xs text-gray-500">
                            +{r.readme_analysis.previewUrls.length - 1}
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

      {/* 分页信息 */}
      {filteredRows.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              显示 {startItem}-{endItem} 条，共 {filteredRows.length.toLocaleString()} 条结果
              {showStaticOnly && ' (已筛选可运行项目)'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || running}
                className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                上一页
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      disabled={running}
                      className={clsx(
                        'px-3 py-1 text-sm border rounded',
                      currentPage === pageNum
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-600 hover:bg-gray-700 text-gray-300',
                        running && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || running}
                className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
              >
                下一页
              </button>
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
