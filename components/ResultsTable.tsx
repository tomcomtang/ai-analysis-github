'use client'

import { useState } from 'react'
import clsx from 'clsx'

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
}

type ResultsTableProps = {
  rows: Repo[]
  currentPage: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  running: boolean
}

export default function ResultsTable({ 
  rows, 
  currentPage, 
  totalCount, 
  perPage, 
  onPageChange, 
  running 
}: ResultsTableProps) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [showModal, setShowModal] = useState(false)

  const showRepoDetail = (repo: Repo) => {
    setSelectedRepo(repo)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRepo(null)
  }

  const totalPages = Math.ceil(totalCount / perPage)
  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)

  return (
    <>
      <div className="card">
        <div className="overflow-hidden rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-300 h-12">
                <Th>仓库</Th>
                <Th>作者</Th>
                <Th>描述</Th>
                <Th>语言</Th>
                <Th>Stars</Th>
                <Th>Forks</Th>
                <Th>更新时间</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-800/50 h-16">
                  <Td>
                    <a className="text-emerald-400 hover:underline font-medium" href={r.html_url} target="_blank" rel="noreferrer">{r.full_name}</a>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <img 
                        src={r.owner_avatar} 
                        alt={r.owner}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <a 
                        href={r.owner_html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline text-sm"
                      >
                        {r.owner}
                      </a>
                    </div>
                  </Td>
                  <Td className="text-gray-300">
                    <div className="truncate max-w-[200px]" title={r.description || ''}>
                      {r.description || '无描述'}
                    </div>
                  </Td>
                  <Td>
                    <span className="badge border-emerald-200 text-emerald-300 bg-emerald-900/30">{r.language || 'N/A'}</span>
                  </Td>
                  <Td className="font-medium text-white">{r.stargazers_count?.toLocaleString() || 0}</Td>
                  <Td className="font-medium text-white">{r.forks_count?.toLocaleString() || 0}</Td>
                  <Td className="text-gray-300">
                    <div className="truncate max-w-[120px]" title={new Date(r.updated_at).toLocaleString()}>
                      {new Date(r.updated_at).toLocaleDateString()}
                    </div>
                  </Td>
                  <Td>
                    <button
                      onClick={() => showRepoDetail(r)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1 rounded hover:bg-emerald-900/30"
                    >
                      详情
                    </button>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td colSpan={8}>
                    <div className="text-center text-gray-400 py-10">暂无数据</div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页信息 */}
      {totalCount > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              显示 {startItem}-{endItem} 条，共 {totalCount.toLocaleString()} 条结果
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

      {/* 详情弹窗 */}
      {showModal && selectedRepo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRepo.full_name}</h3>
                  <p className="text-sm text-gray-300 mt-1">{selectedRepo.description || '无描述'}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <img 
                  src={selectedRepo.owner_avatar} 
                  alt={selectedRepo.owner}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <label className="text-xs font-medium text-gray-400">作者</label>
                  <a 
                    href={selectedRepo.owner_html_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline text-lg font-medium block"
                  >
                    {selectedRepo.owner}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400">语言</label>
                  <p className="text-sm text-white">{selectedRepo.language || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400">Stars</label>
                  <p className="text-sm text-white">{selectedRepo.stargazers_count?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400">Forks</label>
                  <p className="text-sm text-white">{selectedRepo.forks_count?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400">更新时间</label>
                  <p className="text-sm text-white">{new Date(selectedRepo.updated_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400">仓库链接</label>
                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline text-sm block mt-1"
                >
                  {selectedRepo.html_url}
                </a>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  关闭
                </button>
                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  访问仓库
                </a>
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
