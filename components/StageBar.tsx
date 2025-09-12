'use client'

import clsx from 'clsx'

type Stage = 'idle' | 'searching' | 'analyzing' | 'generating' | 'done' | 'error'

type StageBarProps = {
  stage: Stage
}

export default function StageBar({ stage }: StageBarProps) {
  const steps: { key: Stage, label: string }[] = [
    { key: 'searching', label: '请求 GitHub' },
    { key: 'analyzing', label: '分析项目' },
    { key: 'generating', label: '输出结果' },
    { key: 'done', label: '完成' },
  ]
  
  const activeIndex = Math.max(steps.findIndex(s => s.key === stage), stage === 'error' ? 0 : -1)
  
  return (
    <div className="w-full">
      <div className="flex items-center w-full">
        {steps.map((s, idx) => {
          const active = idx <= activeIndex
          const isLast = idx === steps.length - 1
          
          return (
            <div key={s.key} className="flex items-center flex-1">
              {/* 步骤项 */}
              <div className={clsx(
                'flex items-center',
                isLast ? 'justify-end' : 'justify-start'
              )}>
                {/* 步骤圆圈 */}
                <div className={clsx(
                  'relative flex items-center justify-center w-8 h-8 text-sm font-medium transition-all duration-300 rounded-full',
                  active 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                    : 'bg-gray-700 text-gray-400'
                )}>
                  {active && idx < activeIndex ? (
                    // 已完成步骤显示对勾
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // 当前步骤显示数字
                    idx + 1
                  )}
                </div>
                
                {/* 步骤标签 */}
                <span className={clsx(
                  'ml-3 text-sm font-medium transition-colors',
                  active ? 'text-emerald-300' : 'text-gray-500'
                )}>
                  {s.label}
                </span>
              </div>
              
              {/* 连接线 */}
              {!isLast && (
                <div className="flex items-center flex-1 mx-4">
                  <div className={clsx(
                    'h-px w-full transition-colors',
                    active ? 'bg-emerald-500' : 'bg-gray-600'
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* 错误状态 */}
      {stage === 'error' && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full text-red-400 text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            发生错误，请重试
          </div>
        </div>
      )}
    </div>
  )
}