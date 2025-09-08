import OpenAI from 'openai'

// 只有在有API Key时才初始化OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export interface ReadmeAnalysis {
  isStaticDeploy: boolean
  hasPreviewUrl: boolean
  hasDeployButtons: boolean
  previewUrls: string[]
  deployPlatforms: string[]
  confidence: number
  summary: string
}

export async function analyzeReadme(readmeContent: string, repoName: string): Promise<ReadmeAnalysis> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // 如果没有OpenAI API Key，使用简单的关键词匹配
    return analyzeReadmeFallback(readmeContent)
  }

  try {
    const prompt = `
请分析以下GitHub仓库的README内容，判断它是否是静态部署项目，并提取相关信息：

仓库名称: ${repoName}
README内容:
${readmeContent.substring(0, 4000)} // 限制长度避免token超限

请以JSON格式返回分析结果：
{
  "isStaticDeploy": boolean, // 是否为静态部署项目（如个人博客、画廊、游戏等）
  "hasPreviewUrl": boolean, // 是否包含预览地址
  "hasDeployButtons": boolean, // 是否包含Vercel/Netlify等部署按钮
  "previewUrls": string[], // 提取的预览地址列表
  "deployPlatforms": string[], // 部署平台列表（如Vercel, Netlify, GitHub Pages等）
  "confidence": number, // 分析置信度（0-1）
  "summary": string // 简要分析说明
}

判断标准：
1. 静态部署项目：可以直接运行或部署的前端项目，包括：
   - 个人博客、作品集、画廊、游戏
   - 静态网站、文档网站、展示页面
   - 可以直接在浏览器中运行的项目
   - 有明确的部署说明或一键部署按钮的项目

2. 预览地址：包含以下任一内容：
   - Live demo、preview、访问地址
   - 在线演示链接
   - 部署后的访问地址

3. 部署按钮：包含以下任一内容：
   - Vercel、Netlify、GitHub Pages等一键部署按钮
   - 明确的部署说明和步骤
   - 支持静态托管的配置

4. 重点关注：可以直接运行、部署或访问的项目，优先选择有预览地址的项目
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的GitHub项目分析助手，擅长识别静态部署项目和提取预览信息。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // 尝试解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // 如果无法解析JSON，使用fallback
    return analyzeReadmeFallback(readmeContent)
  } catch (error) {
    console.error('OpenAI analysis failed:', error)
    return analyzeReadmeFallback(readmeContent)
  }
}

function analyzeReadmeFallback(readmeContent: string): ReadmeAnalysis {
  const content = readmeContent.toLowerCase()
  
  // 关键词匹配 - 更精确的静态项目识别
  const staticDeployKeywords = [
    // 项目类型
    'blog', 'portfolio', 'gallery', 'game', 'demo', 'showcase', 'website',
    'personal website', '作品集', '博客', '画廊', '游戏', '展示', '网站',
    // 技术栈
    'html', 'css', 'javascript', 'react', 'vue', 'angular', 'svelte',
    'next.js', 'nuxt', 'gatsby', 'astro', 'sveltekit',
    // 部署相关
    'static', 'spa', 'frontend', 'client-side', 'browser',
    // 运行相关
    'npm start', 'yarn dev', 'npm run dev', 'serve', 'localhost',
    '可以直接运行', '直接部署', '一键部署'
  ]
  
  const previewUrlKeywords = [
    'live demo', 'preview', 'demo', 'visit', 'access', 'online',
    'vercel.app', 'netlify.app', 'github.io', '预览', '访问', '在线',
    'try it', 'see it live', 'check it out', '体验', '试用'
  ]
  
  const deployButtonKeywords = [
    'deploy', 'vercel', 'netlify', 'github pages', '部署', '一键部署',
    'deploy button', 'one-click deploy', '一键部署按钮',
    'vercel deploy', 'netlify deploy', 'github pages deploy'
  ]
  
  const urlRegex = /https?:\/\/[^\s\)]+/g
  const urls = content.match(urlRegex) || []
  
  const isStaticDeploy = staticDeployKeywords.some(keyword => content.includes(keyword))
  const hasPreviewUrl = previewUrlKeywords.some(keyword => content.includes(keyword)) || urls.length > 0
  const hasDeployButtons = deployButtonKeywords.some(keyword => content.includes(keyword))
  
  const previewUrls = urls.filter(url => 
    url.includes('vercel.app') || 
    url.includes('netlify.app') || 
    url.includes('github.io') ||
    url.includes('demo') ||
    url.includes('preview')
  )
  
  const deployPlatforms: string[] = []
  if (content.includes('vercel')) deployPlatforms.push('Vercel')
  if (content.includes('netlify')) deployPlatforms.push('Netlify')
  if (content.includes('github pages')) deployPlatforms.push('GitHub Pages')
  
  // 更精确的置信度计算
  let confidence = 0
  if (isStaticDeploy) confidence += 0.4  // 基础静态项目识别
  if (hasPreviewUrl) confidence += 0.4   // 有预览地址很重要
  if (hasDeployButtons) confidence += 0.2 // 有部署按钮加分
  
  // 额外加分项
  if (previewUrls.length > 0) confidence += 0.1  // 有多个预览地址
  if (deployPlatforms.length > 0) confidence += 0.1  // 有部署平台
  
  return {
    isStaticDeploy,
    hasPreviewUrl,
    hasDeployButtons,
    previewUrls,
    deployPlatforms,
    confidence,
    summary: `基于关键词匹配分析：${isStaticDeploy ? '疑似静态项目' : '非静态项目'}，${hasPreviewUrl ? '包含预览地址' : '无预览地址'}，${hasDeployButtons ? '包含部署按钮' : '无部署按钮'}`
  }
}
