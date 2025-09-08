import { NextRequest } from 'next/server'
import { analyzeReadme, ReadmeAnalysis } from '../../../lib/ai-analyzer'

// 简单的fallback分析函数
function analyzeReadmeFallback(content: string): ReadmeAnalysis {
  const text = content.toLowerCase()
  
  const staticKeywords = ['blog', 'portfolio', 'gallery', 'game', 'demo', 'website', 'react', 'vue', 'next.js']
  const previewKeywords = ['demo', 'preview', 'live', 'vercel.app', 'netlify.app']
  const deployKeywords = ['deploy', 'vercel', 'netlify']
  
  const isStaticDeploy = staticKeywords.some(keyword => text.includes(keyword))
  const hasPreviewUrl = previewKeywords.some(keyword => text.includes(keyword))
  const hasDeployButtons = deployKeywords.some(keyword => text.includes(keyword))
  
  return {
    isStaticDeploy,
    hasPreviewUrl,
    hasDeployButtons,
    previewUrls: [],
    deployPlatforms: [],
    confidence: isStaticDeploy ? 0.5 : 0.2,
    summary: '基于描述的基础分析'
  }
}

function encodeEvent(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || ''
  const language = searchParams.get('language') || ''
  const stars = searchParams.get('stars') || ''
  const per_page = Number(searchParams.get('per_page') || '1000') // 默认100条
  const page = Number(searchParams.get('page') || '1')

  const controller = new AbortController()
  const { signal } = controller

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: any) => controller.enqueue(new TextEncoder().encode(encodeEvent(obj)))
      try {
        send({ type: 'stage', stage: 'searching' })
        const q: string[] = []
        if (query) q.push(query)
        if (language) q.push(`language:${language}`)
        if (stars) q.push(`stars:${stars}`)
        const url = new URL('https://api.github.com/search/repositories')
        url.searchParams.set('q', q.join(' '))
        url.searchParams.set('sort', 'stars')
        url.searchParams.set('order', 'desc')
        url.searchParams.set('per_page', String(per_page))
        url.searchParams.set('page', String(page))

        const ghHeaders: Record<string, string> = {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        }
        if (process.env.GITHUB_TOKEN) ghHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`

        const res = await fetch(url, { headers: ghHeaders, signal })
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
        const json = await res.json()

        // 发送总数
        send({ type: 'total_count', total_count: json.total_count || 0 })

        send({ type: 'stage', stage: 'analyzing' })
        
        // 处理第一页数据
        for (const item of (json.items || [])) {
          // 获取README内容
          let readmeAnalysis: ReadmeAnalysis | null = null
          try {
            const readmeUrl = `https://api.github.com/repos/${item.full_name}/readme`
            const readmeRes = await fetch(readmeUrl, { headers: ghHeaders, signal })
            if (readmeRes.ok) {
              const readmeData = await readmeRes.json()
              const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8')
              readmeAnalysis = await analyzeReadme(readmeContent, item.full_name)
            } else {
              // 如果README获取失败，使用fallback分析
              readmeAnalysis = analyzeReadmeFallback(item.description || '')
            }
          } catch (err) {
            console.error(`Failed to fetch README for ${item.full_name}:`, err)
            // 如果README获取失败，使用fallback分析
            readmeAnalysis = analyzeReadmeFallback(item.description || '')
          }

          const result = {
            full_name: item.full_name,
            description: item.description,
            language: item.language,
            stargazers_count: item.stargazers_count,
            forks_count: item.forks_count,
            html_url: item.html_url,
            updated_at: item.updated_at,
            owner: item.owner?.login || '',
            owner_avatar: item.owner?.avatar_url || '',
            owner_html_url: item.owner?.html_url || '',
            readme_analysis: readmeAnalysis,
          }
          send({ type: 'result', result })
        }

        // 继续获取更多页面数据（最多10页，即1000条）
        const totalPages = Math.min(Math.ceil((json.total_count || 0) / 100), 10)
        for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
          try {
            const nextUrl = new URL('https://api.github.com/search/repositories')
            nextUrl.searchParams.set('q', q.join(' '))
            nextUrl.searchParams.set('sort', 'stars')
            nextUrl.searchParams.set('order', 'desc')
            nextUrl.searchParams.set('per_page', '100')
            nextUrl.searchParams.set('page', pageNum.toString())

            const nextRes = await fetch(nextUrl, { headers: ghHeaders, signal })
            if (!nextRes.ok) break
            
            const nextJson = await nextRes.json()
            for (const item of (nextJson.items || [])) {
              // 获取README内容
              let readmeAnalysis: ReadmeAnalysis | null = null
              try {
                const readmeUrl = `https://api.github.com/repos/${item.full_name}/readme`
                const readmeRes = await fetch(readmeUrl, { headers: ghHeaders, signal })
                if (readmeRes.ok) {
                  const readmeData = await readmeRes.json()
                  const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8')
                  readmeAnalysis = await analyzeReadme(readmeContent, item.full_name)
                } else {
                  // 如果README获取失败，使用fallback分析
                  readmeAnalysis = analyzeReadmeFallback(item.description || '')
                }
              } catch (err) {
                console.error(`Failed to fetch README for ${item.full_name}:`, err)
                // 如果README获取失败，使用fallback分析
                readmeAnalysis = analyzeReadmeFallback(item.description || '')
              }

              const result = {
                full_name: item.full_name,
                description: item.description,
                language: item.language,
                stargazers_count: item.stargazers_count,
                forks_count: item.forks_count,
                html_url: item.html_url,
                updated_at: item.updated_at,
                owner: item.owner?.login || '',
                owner_avatar: item.owner?.avatar_url || '',
                owner_html_url: item.owner?.html_url || '',
                readme_analysis: readmeAnalysis,
              }
              send({ type: 'result', result })
            }
          } catch (err) {
            console.error(`Error fetching page ${pageNum}:`, err)
            break
          }
        }

        send({ type: 'stage', stage: 'generating' })
        send({ type: 'end' })
        controller.close()
      } catch (err: any) {
        send({ type: 'error', message: err?.message || 'unknown error' })
        controller.close()
      }
    },
    cancel() {
      controller.abort()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}


