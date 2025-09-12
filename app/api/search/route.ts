import { NextRequest } from 'next/server'
import { Octokit } from '@octokit/rest'

// 暂时移除AI分析，只返回基础数据

function encodeEvent(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || ''
  const language = searchParams.get('language') || ''
  const stars = searchParams.get('stars') || ''
  const aiFilter = searchParams.get('aiFilter') || ''
  const per_page = Number(searchParams.get('per_page') || '100')
  const page = Number(searchParams.get('page') || '1')
  const start_page = Number(searchParams.get('start_page') || '1') // 新增：起始页面参数

  const controller = new AbortController()
  const { signal } = controller

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: any) => controller.enqueue(new TextEncoder().encode(encodeEvent(obj)))
      try {
        send({ type: 'stage', stage: 'searching' })
        
        // 初始化Octokit
        const githubToken = process.env.GITHUB_TOKEN
        if (!githubToken) {
          throw new Error('GITHUB_TOKEN environment variable is required')
        }

        const octokit = new Octokit({
          auth: githubToken
        })

        // 构建搜索查询
        const searchQuery: string[] = []
        if (query) searchQuery.push(query)
        if (language) {
          // 单选语言，直接添加
          searchQuery.push(`language:${language}`)
        }
        if (stars) searchQuery.push(`stars:>=${stars}`)

        const q = searchQuery.join(' ')
        console.log('GitHub search query:', q)
        console.log('Search parameters:', {
          q,
          sort: 'stars',
          order: 'desc',
          per_page: Math.min(per_page, 100),
          page
        })
        
        // 输出等效的GitHub网页搜索URL
        const webSearchUrl = `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories&s=stars&o=desc`
        console.log('Equivalent GitHub web search URL:', webSearchUrl)

        // 使用Octokit搜索仓库
        const searchResponse = await octokit.rest.search.repos({
          q,
          sort: 'stars',
          order: 'desc',
          per_page: Math.min(per_page, 100), // GitHub API限制每页最多100条
          page
        })

        console.log("GitHub API Response:")
        console.log("- Total count:", searchResponse.data.total_count)
        console.log("- Items length:", searchResponse.data.items.length)
        console.log("- First 5 repositories:")
        searchResponse.data.items.slice(0, 5).forEach((repo, index) => {
          console.log(`  ${index + 1}. ${repo.full_name} (⭐${repo.stargazers_count}, ${repo.language || 'No language'})`)
        })

        // 发送总数
        send({ type: 'total_count', total_count: searchResponse.data.total_count })

        send({ type: 'stage', stage: 'processing' })
        
        // 处理第一页数据 - 暂时移除AI分析
        for (const item of searchResponse.data.items) {
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
            // 暂时移除AI分析字段
            comprehensive_analysis: null,
          }
          send({ type: 'result', result })
        }

        // 继续获取更多页面数据（最多10页，即1000条）
        const totalPages = Math.min(Math.ceil(searchResponse.data.total_count / 100), 10)
        const endPage = Math.min(start_page + 9, totalPages) // 从start_page开始，最多加载10页
        for (let pageNum = start_page + 1; pageNum <= endPage; pageNum++) {
          try {
            console.log(`Fetching page ${pageNum}...`)
            
            const nextSearchResponse = await octokit.rest.search.repos({
              q,
              sort: 'stars',
              order: 'desc',
              per_page: 100,
              page: pageNum
            })
            
            for (const item of nextSearchResponse.data.items) {
              // 暂时移除AI分析，只返回基础数据
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
                // 暂时移除AI分析字段
                comprehensive_analysis: null,
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
        console.error('Search error:', err)
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