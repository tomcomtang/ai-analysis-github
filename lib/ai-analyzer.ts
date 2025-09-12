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

export interface GitHubAboutAnalysis {
  homepage: string | null
  hasHomepage: boolean
  topics: string[]
  hasStaticTopics: boolean
}

export interface FileStructureAnalysis {
  hasIndexHtml: boolean
  hasPublicDir: boolean
  hasDistDir: boolean
  hasOutDir: boolean
  hasNextjsStructure: boolean
  hasViteStructure: boolean
  hasReactStructure: boolean
  hasVueStructure: boolean
  staticFiles: string[]
  isStaticProject: boolean
  confidence: number
}

export interface ComprehensiveAnalysis {
  readme: ReadmeAnalysis
  about: GitHubAboutAnalysis
  fileStructure: FileStructureAnalysis
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

export interface AIFilterAnalysis {
  matches: boolean
  confidence: number
  reasons: string[]
  score: number
  summary: string
}

export interface FilterRules {
  include: string[]      // 包含条件
  exclude: string[]      // 排除条件
  prioritize: string[]   // 优先条件
  requirements: string[] // 必需条件
  preferences: string[]  // 偏好条件
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
   - 排除需要接口服务、数据库、后端API的项目

2. 预览地址：包含以下任一内容：
   - Live demo、preview、访问地址
   - 在线演示链接
   - 部署后的访问地址

3. 部署按钮：包含以下任一内容：
   - Vercel、Netlify、GitHub Pages等一键部署按钮
   - 明确的部署说明和步骤
   - 支持静态托管的配置

4. 排除后端项目：包含以下特征的项目不是静态项目：
   - 需要API接口、数据库、服务器
   - 包含express、koa、nestjs等后端框架
   - 包含数据库相关依赖（mysql、mongodb等）
   - 需要运行服务器才能访问的项目

5. 重点关注：可以直接运行、部署或访问的纯前端项目，优先选择有预览地址的项目
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
  
  // 后端项目关键词 - 如果包含这些，则不是静态项目
  const backendKeywords = [
    'api', 'server', 'backend', 'database', 'mysql', 'postgresql', 'mongodb', 'redis',
    'express', 'koa', 'fastify', 'nest', 'nestjs', 'prisma', 'sequelize', 'typeorm',
    'passport', 'jwt', 'bcrypt', 'cors', 'socket.io', 'graphql', 'apollo'
  ]
  
  // 检查是否包含后端关键词
  const hasBackendKeywords = backendKeywords.some(keyword => content.includes(keyword))
  
  const previewUrlKeywords = [
    'live demo', 'preview', 'demo', 'visit', 'access', 'online',
    'vercel.app', 'netlify.app', 'github.io', '预览', '访问', '在线',
    'try it', 'see it live', 'check it out', '体验', '试用'
  ];
  
  const deployButtonKeywords = [
    'deploy', 'vercel', 'netlify', 'github pages', '部署', '一键部署',
    'deploy button', 'one-click deploy', '一键部署按钮',
    'vercel deploy', 'netlify deploy', 'github pages deploy'
  ];
  
  const urlRegex = /https?:\/\/[^\s\)]+/g
  const urls = content.match(urlRegex) || []
  
  const isStaticDeploy = !hasBackendKeywords && staticDeployKeywords.some(keyword => content.includes(keyword))
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

// 分析GitHub About区域
export function analyzeGitHubAbout(repoData: any): GitHubAboutAnalysis {
  const homepage = repoData.homepage || null
  const topics = repoData.topics || []
  
  // 静态项目相关的topics
  const staticTopics = [
    'website', 'blog', 'portfolio', 'gallery', 'game', 'demo', 'showcase',
    'static', 'frontend', 'spa', 'react', 'vue', 'angular', 'nextjs',
    'gatsby', 'nuxt', 'svelte', 'astro', 'html', 'css', 'javascript'
  ]
  
  const hasStaticTopics = topics.some((topic: string) => 
    staticTopics.some(staticTopic => 
      topic.toLowerCase().includes(staticTopic.toLowerCase())
    )
  )
  
  return {
    homepage,
    hasHomepage: !!homepage,
    topics,
    hasStaticTopics
  }
}

// 分析项目文件结构
export async function analyzeFileStructure(repoName: string, githubToken?: string): Promise<FileStructureAnalysis> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`
    }

    // 获取仓库根目录内容
    const contentsUrl = `https://api.github.com/repos/${repoName}/contents`
    const response = await fetch(contentsUrl, { headers })
    
    if (!response.ok) {
      return getFileStructureFallback()
    }
    
    const contents = await response.json()
    const fileNames = contents.map((item: any) => item.name.toLowerCase())
    
    // 检查关键文件和目录
    const hasIndexHtml = fileNames.includes('index.html')
    const hasPublicDir = fileNames.includes('public')
    const hasDistDir = fileNames.includes('dist')
    const hasOutDir = fileNames.includes('out')
    
    // 检查框架结构
    const hasNextjsStructure = fileNames.includes('next.config.js') || 
                              fileNames.includes('next.config.mjs') ||
                              fileNames.includes('next.config.ts')
    
    const hasViteStructure = fileNames.includes('vite.config.js') || 
                            fileNames.includes('vite.config.ts') ||
                            fileNames.includes('vite.config.mjs')
    
    const hasReactStructure = fileNames.includes('package.json') && 
                             (fileNames.includes('src') || hasIndexHtml)
    
    const hasVueStructure = fileNames.includes('vue.config.js') || 
                           fileNames.includes('nuxt.config.js')
    
    // 检查package.json中的构建脚本和依赖
    let packageJson: any = null
    try {
      const packageJsonUrl = `https://api.github.com/repos/${repoName}/contents/package.json`
      const packageResponse = await fetch(packageJsonUrl, { headers })
      if (packageResponse.ok) {
        const packageData = await packageResponse.json()
        const packageContent = Buffer.from(packageData.content, 'base64').toString('utf-8')
        packageJson = JSON.parse(packageContent)
      }
    } catch (e) {
      // 忽略package.json解析错误
    }
    
    // 检查是否为后端项目
    const backendDependencies = [
      'express', 'koa', 'fastify', 'nest', 'nestjs',
      'mongoose', 'sequelize', 'typeorm', 'prisma',
      'mysql2', 'pg', 'sqlite3', 'redis',
      'passport', 'jwt', 'bcrypt', 'cors',
      'socket.io', 'ws', 'graphql', 'apollo'
    ]
    
    const hasBackendDeps = packageJson?.dependencies && 
      Object.keys(packageJson.dependencies).some(dep => 
        backendDependencies.some(backendDep => dep.includes(backendDep))
      )
    
    const hasBackendDevDeps = packageJson?.devDependencies && 
      Object.keys(packageJson.devDependencies).some(dep => 
        backendDependencies.some(backendDep => dep.includes(backendDep))
      )
    
    // 分析构建脚本
    const buildScripts = packageJson?.scripts || {}
    const hasBuildScript = Object.keys(buildScripts).some(script => 
      script.includes('build') || script.includes('export') || script.includes('generate')
    )
    
    // 静态文件列表
    const staticFiles = fileNames.filter((name: string) => 
      name.endsWith('.html') || 
      name.endsWith('.css') || 
      name.endsWith('.js') ||
      name.endsWith('.json')
    )
    
    // 综合判断是否为静态项目（排除后端项目）
    let isStaticProject = false
    let confidence = 0
    
    // 如果有后端依赖，直接排除
    if (hasBackendDeps || hasBackendDevDeps) {
      return {
        hasIndexHtml,
        hasPublicDir,
        hasDistDir,
        hasOutDir,
        hasNextjsStructure,
        hasViteStructure,
        hasReactStructure,
        hasVueStructure,
        staticFiles,
        isStaticProject: false,
        confidence: 0
      }
    }
    
    if (hasIndexHtml) {
      isStaticProject = true
      confidence += 0.4
    }
    
    if (hasPublicDir || hasDistDir || hasOutDir) {
      isStaticProject = true
      confidence += 0.3
    }
    
    if (hasNextjsStructure || hasViteStructure) {
      isStaticProject = true
      confidence += 0.2
    }
    
    if (hasBuildScript) {
      confidence += 0.1
    }
    
    return {
      hasIndexHtml,
      hasPublicDir,
      hasDistDir,
      hasOutDir,
      hasNextjsStructure,
      hasViteStructure,
      hasReactStructure,
      hasVueStructure,
      staticFiles,
      isStaticProject,
      confidence: Math.min(confidence, 1)
    }
    
  } catch (error) {
    console.error('File structure analysis failed:', error)
    return getFileStructureFallback()
  }
}

function getFileStructureFallback(): FileStructureAnalysis {
  return {
    hasIndexHtml: false,
    hasPublicDir: false,
    hasDistDir: false,
    hasOutDir: false,
    hasNextjsStructure: false,
    hasViteStructure: false,
    hasReactStructure: false,
    hasVueStructure: false,
    staticFiles: [],
    isStaticProject: false,
    confidence: 0
  }
}

// 综合分析函数
export async function analyzeComprehensively(
  readmeContent: string, 
  repoName: string, 
  repoData: any,
  githubToken?: string
): Promise<ComprehensiveAnalysis> {
  // 并行分析
  const [readmeAnalysis, aboutAnalysis, fileStructureAnalysis] = await Promise.all([
    analyzeReadme(readmeContent, repoName),
    Promise.resolve(analyzeGitHubAbout(repoData)),
    analyzeFileStructure(repoName, githubToken)
  ])
  
  // 合并预览地址
  const combinedPreviewUrls = [
    ...readmeAnalysis.previewUrls,
    ...(aboutAnalysis.homepage ? [aboutAnalysis.homepage] : [])
  ].filter((url, index, self) => self.indexOf(url) === index) // 去重
  
  // 合并部署平台
  const combinedDeployPlatforms = [
    ...readmeAnalysis.deployPlatforms
  ].filter((platform, index, self) => self.indexOf(platform) === index) // 去重
  
  // 综合置信度计算
  const combinedConfidence = Math.min(
    (readmeAnalysis.confidence * 0.4) + 
    (fileStructureAnalysis.confidence * 0.4) + 
    (aboutAnalysis.hasHomepage ? 0.2 : 0), 
    1
  )
  
  // 最终评估
  const finalAssessment = {
    isStaticDeploy: readmeAnalysis.isStaticDeploy || fileStructureAnalysis.isStaticProject,
    hasPreviewUrl: readmeAnalysis.hasPreviewUrl || aboutAnalysis.hasHomepage || combinedPreviewUrls.length > 0,
    hasDeployButtons: readmeAnalysis.hasDeployButtons,
    deployPlatforms: combinedDeployPlatforms,
    confidence: combinedConfidence,
    summary: generateComprehensiveSummary(readmeAnalysis, aboutAnalysis, fileStructureAnalysis)
  }
  
  return {
    readme: readmeAnalysis,
    about: aboutAnalysis,
    fileStructure: fileStructureAnalysis,
    combinedPreviewUrls,
    combinedConfidence,
    finalAssessment
  }
}

function generateComprehensiveSummary(
  readme: ReadmeAnalysis,
  about: GitHubAboutAnalysis,
  fileStructure: FileStructureAnalysis
): string {
  const parts = []
  
  if (readme.isStaticDeploy) {
    parts.push('README分析：静态项目')
  }
  
  if (fileStructure.isStaticProject) {
    parts.push('文件结构：支持静态部署')
  }
  
  if (about.hasHomepage) {
    parts.push('About区域：有主页链接')
  }
  
  if (readme.hasPreviewUrl || about.hasHomepage) {
    parts.push('预览地址：已找到')
  }
  
  if (readme.hasDeployButtons) {
    parts.push('部署按钮：已识别')
  }
  
  return parts.length > 0 ? parts.join('，') : '综合分析：非静态项目'
}

/**
 * 使用AI根据用户过滤规则分析项目
 */
export async function analyzeWithAIFilter(
  repoData: any,
  userFilterRules: string
): Promise<AIFilterAnalysis> {
  if (!openai || !process.env.OPENAI_API_KEY || !userFilterRules.trim()) {
    // 如果没有OpenAI API Key或过滤规则为空，返回默认匹配
    return {
      matches: true,
      confidence: 0.5,
      reasons: ['无AI过滤规则'],
      score: 0.5,
      summary: '未应用AI过滤'
    }
  }

  try {
    const prompt = `
你是一个专业的GitHub项目分析助手。请根据用户的过滤规则分析以下项目是否符合要求。

用户过滤规则：
${userFilterRules}

项目信息：
- 项目名称：${repoData.full_name || 'N/A'}
- 描述：${repoData.description || '无描述'}
- 主要语言：${repoData.language || 'N/A'}
- Star数：${repoData.stargazers_count || 0}
- Fork数：${repoData.forks_count || 0}
- 最后更新：${repoData.updated_at || 'N/A'}
- README内容：${repoData.readme_content ? repoData.readme_content.substring(0, 1000) + '...' : '无README'}

请分析这个项目是否符合用户的过滤规则，并返回JSON格式的结果：

{
  "matches": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["原因1", "原因2", "原因3"],
  "score": 0.0-1.0,
  "summary": "简要总结"
}

评分标准：
- matches: 项目是否符合过滤规则
- confidence: 分析结果的置信度
- reasons: 支持判断的具体原因列表
- score: 项目质量评分（0-1）
- summary: 一句话总结

请确保返回有效的JSON格式。
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的GitHub项目分析助手，擅长根据用户需求筛选和评估项目质量。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // 尝试解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        matches: result.matches || false,
        confidence: result.confidence || 0.5,
        reasons: result.reasons || [],
        score: result.score || 0.5,
        summary: result.summary || 'AI分析完成'
      }
    }

    // 如果无法解析JSON，使用fallback
    return analyzeWithAIFilterFallback(repoData, userFilterRules)
  } catch (error) {
    console.error('AI过滤分析失败:', error)
    return analyzeWithAIFilterFallback(repoData, userFilterRules)
  }
}

/**
 * AI过滤分析的fallback函数
 */
function analyzeWithAIFilterFallback(
  repoData: any,
  userFilterRules: string
): AIFilterAnalysis {
  const rules = userFilterRules.toLowerCase()
  const repoName = (repoData.full_name || '').toLowerCase()
  const description = (repoData.description || '').toLowerCase()
  const language = (repoData.language || '').toLowerCase()
  const readme = (repoData.readme_content || '').toLowerCase()
  
  let matches = true
  let confidence = 0.5
  const reasons: string[] = []
  let score = 0.5

  // 基础评分
  if (repoData.stargazers_count > 100) score += 0.2
  if (repoData.stargazers_count > 500) score += 0.1
  if (repoData.forks_count > 50) score += 0.1
  if (repoData.description && repoData.description.length > 50) score += 0.1

  // 关键词匹配
  if (rules.includes('静态') || rules.includes('static')) {
    if (readme.includes('static') || readme.includes('静态')) {
      reasons.push('包含静态部署相关描述')
      confidence += 0.2
    }
  }

  if (rules.includes('前端') || rules.includes('frontend')) {
    const frontendLanguages = ['javascript', 'typescript', 'html', 'css', 'vue', 'react', 'angular']
    if (frontendLanguages.includes(language)) {
      reasons.push('主要语言为前端技术')
      confidence += 0.3
    }
  }

  if (rules.includes('预览') || rules.includes('preview') || rules.includes('demo')) {
    if (readme.includes('preview') || readme.includes('demo') || readme.includes('预览')) {
      reasons.push('包含预览或演示信息')
      confidence += 0.2
    }
  }

  if (rules.includes('排除') || rules.includes('不要') || rules.includes('exclude')) {
    if (rules.includes('后端') && (readme.includes('server') || readme.includes('api') || readme.includes('database'))) {
      matches = false
      reasons.push('包含后端相关功能')
    }
  }

  // 确保confidence在0-1范围内
  confidence = Math.min(Math.max(confidence, 0), 1)
  score = Math.min(Math.max(score, 0), 1)

  return {
    matches,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['基础项目信息分析'],
    score,
    summary: matches ? '符合过滤规则' : '不符合过滤规则'
  }
}

/**
 * 第一步：使用AI梳理用户的过滤文本为结构化规则
 */
export async function parseFilterRules(userFilterText: string): Promise<FilterRules> {
  if (!openai || !process.env.OPENAI_API_KEY || !userFilterText.trim()) {
    // 如果没有OpenAI API Key或过滤文本为空，返回默认规则
    return {
      include: [],
      exclude: [],
      prioritize: [],
      requirements: [],
      preferences: []
    }
  }

  try {
    const prompt = `
你是一个专业的项目筛选规则解析助手。请将用户的过滤需求解析为结构化的规则。

用户输入的过滤需求：
"${userFilterText}"

请将这些需求解析为以下JSON格式的规则：

{
  "include": ["包含条件1", "包含条件2"],
  "exclude": ["排除条件1", "排除条件2"], 
  "prioritize": ["优先条件1", "优先条件2"],
  "requirements": ["必需条件1", "必需条件2"],
  "preferences": ["偏好条件1", "偏好条件2"]
}

规则分类说明：
- include: 项目必须包含的特征（如：前端项目、静态部署）
- exclude: 项目不能包含的特征（如：后端项目、需要数据库）
- prioritize: 优先考虑的特征（如：有预览链接、最近更新）
- requirements: 硬性要求（如：必须有README、必须可运行）
- preferences: 软性偏好（如：文档完整、代码规范）

请确保：
1. 每个条件都是简洁明确的描述
2. 条件之间不重复
3. 返回有效的JSON格式
4. 如果某个分类没有条件，使用空数组[]
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的项目筛选规则解析助手，擅长将自然语言需求转换为结构化的筛选条件。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 600
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // 尝试解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        include: result.include || [],
        exclude: result.exclude || [],
        prioritize: result.prioritize || [],
        requirements: result.requirements || [],
        preferences: result.preferences || []
      }
    }

    // 如果无法解析JSON，使用fallback
    return parseFilterRulesFallback(userFilterText)
  } catch (error) {
    console.error('AI规则解析失败:', error)
    return parseFilterRulesFallback(userFilterText)
  }
}

/**
 * 规则解析的fallback函数
 */
function parseFilterRulesFallback(userFilterText: string): FilterRules {
  const text = userFilterText.toLowerCase()
  const rules: FilterRules = {
    include: [],
    exclude: [],
    prioritize: [],
    requirements: [],
    preferences: []
  }

  // 简单的关键词匹配
  if (text.includes('只显示') || text.includes('只要')) {
    if (text.includes('前端')) rules.include.push('前端项目')
    if (text.includes('静态')) rules.include.push('静态部署项目')
    if (text.includes('react')) rules.include.push('React项目')
    if (text.includes('vue')) rules.include.push('Vue项目')
  }

  if (text.includes('排除') || text.includes('不要') || text.includes('不包含')) {
    if (text.includes('后端')) rules.exclude.push('后端项目')
    if (text.includes('数据库')) rules.exclude.push('需要数据库的项目')
    if (text.includes('服务器')) rules.exclude.push('需要服务器的项目')
  }

  if (text.includes('优先') || text.includes('优先显示')) {
    if (text.includes('预览')) rules.prioritize.push('有预览链接的项目')
    if (text.includes('更新')) rules.prioritize.push('最近更新的项目')
    if (text.includes('star')) rules.prioritize.push('Star数高的项目')
  }

  return rules
}

/**
 * 第二步：使用梳理后的规则分析项目
 */
export async function analyzeWithStructuredRules(
  repoData: any,
  filterRules: FilterRules
): Promise<AIFilterAnalysis> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // 如果没有OpenAI API Key，使用fallback
    return analyzeWithStructuredRulesFallback(repoData, filterRules)
  }

  try {
    const prompt = `
你是一个专业的GitHub项目分析助手。请根据结构化的筛选规则分析以下项目。

筛选规则：
- 包含条件：${filterRules.include.join(', ') || '无'}
- 排除条件：${filterRules.exclude.join(', ') || '无'}
- 优先条件：${filterRules.prioritize.join(', ') || '无'}
- 必需条件：${filterRules.requirements.join(', ') || '无'}
- 偏好条件：${filterRules.preferences.join(', ') || '无'}

项目信息：
- 项目名称：${repoData.full_name || 'N/A'}
- 描述：${repoData.description || '无描述'}
- 主要语言：${repoData.language || 'N/A'}
- Star数：${repoData.stargazers_count || 0}
- Fork数：${repoData.forks_count || 0}
- 最后更新：${repoData.updated_at || 'N/A'}
- README内容：${repoData.readme_content ? repoData.readme_content.substring(0, 1000) + '...' : '无README'}

请分析这个项目是否符合筛选规则，并返回JSON格式的结果：

{
  "matches": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["原因1", "原因2", "原因3"],
  "score": 0.0-1.0,
  "summary": "简要总结"
}

评分标准：
- matches: 项目是否符合所有必需条件和包含条件，且不违反排除条件
- confidence: 分析结果的置信度
- reasons: 支持判断的具体原因列表
- score: 项目质量评分（0-1），考虑优先条件和偏好条件
- summary: 一句话总结

请确保返回有效的JSON格式。
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的GitHub项目分析助手，擅长根据结构化规则筛选和评估项目质量。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // 尝试解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        matches: result.matches || false,
        confidence: result.confidence || 0.5,
        reasons: result.reasons || [],
        score: result.score || 0.5,
        summary: result.summary || 'AI分析完成'
      }
    }

    // 如果无法解析JSON，使用fallback
    return analyzeWithStructuredRulesFallback(repoData, filterRules)
  } catch (error) {
    console.error('结构化规则分析失败:', error)
    return analyzeWithStructuredRulesFallback(repoData, filterRules)
  }
}

/**
 * 结构化规则分析的fallback函数
 */
function analyzeWithStructuredRulesFallback(
  repoData: any,
  filterRules: FilterRules
): AIFilterAnalysis {
  let matches = true
  let confidence = 0.5
  const reasons: string[] = []
  let score = 0.5

  const repoName = (repoData.full_name || '').toLowerCase()
  const description = (repoData.description || '').toLowerCase()
  const language = (repoData.language || '').toLowerCase()
  const readme = (repoData.readme_content || '').toLowerCase()

  // 检查必需条件
  for (const requirement of filterRules.requirements) {
    if (requirement.includes('README') && !readme) {
      matches = false
      reasons.push('缺少README文档')
    }
  }

  // 检查包含条件
  for (const includeRule of filterRules.include) {
    if (includeRule.includes('前端')) {
      const frontendLanguages = ['javascript', 'typescript', 'html', 'css', 'vue', 'react', 'angular']
      if (frontendLanguages.includes(language)) {
        reasons.push('主要语言为前端技术')
        confidence += 0.2
      } else {
        matches = false
        reasons.push('不是前端项目')
      }
    }
  }

  // 检查排除条件
  for (const excludeRule of filterRules.exclude) {
    if (excludeRule.includes('后端') && (readme.includes('server') || readme.includes('api'))) {
      matches = false
      reasons.push('包含后端功能')
    }
  }

  // 计算优先条件加分
  for (const priorityRule of filterRules.prioritize) {
    if (priorityRule.includes('预览') && (readme.includes('preview') || readme.includes('demo'))) {
      score += 0.2
      reasons.push('包含预览信息')
    }
    if (priorityRule.includes('star') && repoData.stargazers_count > 100) {
      score += 0.1
      reasons.push('Star数较高')
    }
  }

  // 基础评分
  if (repoData.stargazers_count > 100) score += 0.2
  if (repoData.description && repoData.description.length > 50) score += 0.1

  // 确保数值在合理范围内
  confidence = Math.min(Math.max(confidence, 0), 1)
  score = Math.min(Math.max(score, 0), 1)

  return {
    matches,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['基础项目信息分析'],
    score,
    summary: matches ? '符合筛选规则' : '不符合筛选规则'
  }
}
