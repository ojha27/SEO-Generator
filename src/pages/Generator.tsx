import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { seoAPI } from '../services/api'
import { 
  FileText, 
  Globe, 
  Target, 
  Loader2, 
  Copy, 
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

const generateSchema = z.object({
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(100, 'Keyword cannot exceed 100 characters'),
  topic: z.string()
    .min(1, 'Topic is required')
    .max(200, 'Topic cannot exceed 200 characters'),
  targetUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
})

type GenerateFormData = z.infer<typeof generateSchema>

const Generator: React.FC = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
  })

  const onSubmit = async (data: GenerateFormData) => {
    if (!(user?.remainingQuota && user.remainingQuota > 0)) {
      toast.error('You have reached your quota limit. Please upgrade your plan.')
      navigate('/profile')
      return
    }

    try {
      setIsGenerating(true)
      setGeneratedContent(null)

      const response = await seoAPI.generate(
        data.keyword,
        data.topic,
        data.targetUrl || undefined
      )

      if (response.data.data) {
        setGeneratedContent(response.data.data)
        
        // Update user quota in context
        if (response.data.userQuota) {
          updateUser({
            usedQuota: response.data.userQuota.used,
            remainingQuota: response.data.userQuota.remaining
          })
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['usage'])
        queryClient.invalidateQueries(['history'])

        toast.success('SEO content generated successfully!')
      } else {
        toast.error(response.data.error || 'Failed to generate content')
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to generate content'
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadContent = () => {
    if (!generatedContent) return

    const content = `
SEO Content Generation Results
Generated on: ${new Date().toLocaleString()}

KEYWORD: ${generatedContent.keyword}
TOPIC: ${generatedContent.topic}
${generatedContent.targetUrl ? `TARGET URL: ${generatedContent.targetUrl}` : ''}

=== META TITLE ===
${generatedContent.generatedContent.metaTitle}

=== META DESCRIPTION ===
${generatedContent.generatedContent.metaDescription}

=== BLOG OUTLINE ===
${generatedContent.generatedContent.blogOutline}

=== INTERNAL LINKS ===
${generatedContent.generatedContent.internalLinks.map((link: any) => 
  `URL: ${link.url}\nAnchor Text: ${link.anchorText}`
).join('\n\n')}

=== TARGET KEYWORDS ===
${generatedContent.generatedContent.targetKeywords.join(', ')}

=== CONTENT LENGTH ===
${generatedContent.generatedContent.contentLength}

=== TONE ===
${generatedContent.generatedContent.tone}

=== GENERATION STATS ===
Processing Time: ${generatedContent.processingTime}ms
Tokens Used: ${generatedContent.tokensUsed}
AI Model: ${generatedContent.tokensUsed ? 'gemini-1.5-flash' : 'N/A'}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-content-${generatedContent.keyword.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Content downloaded successfully!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SEO Content Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate SEO-optimized content using AI-powered insights
        </p>
      </div>

      {/* Quota Warning */}
      {user && user.getRemainingQuota && user.getRemainingQuota() <= 1 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              You have {user.getRemainingQuota()} generation(s) remaining. 
              <button 
                onClick={() => navigate('/profile')}
                className="ml-1 font-medium underline"
              >
                Upgrade your plan for more generations.
              </button>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Content Details</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                Target Keyword *
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('keyword')}
                  type="text"
                  className="input pl-10"
                  placeholder="e.g., digital marketing trends"
                  disabled={isGenerating}
                />
              </div>
              {errors.keyword && (
                <p className="mt-1 text-sm text-red-600">{errors.keyword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Content Theme *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  {...register('topic')}
                  rows={3}
                  className="textarea pl-10"
                  placeholder="e.g., Latest digital marketing trends for 2024 and how businesses can adapt"
                  disabled={isGenerating}
                />
              </div>
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Target URL (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('targetUrl')}
                  type="url"
                  className="input pl-10"
                  placeholder="https://example.com/blog-post"
                  disabled={isGenerating}
                />
              </div>
              {errors.targetUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.targetUrl.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Provide a URL for better internal linking suggestions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Remaining quota:</span> {user?.remainingQuota ?? 0}
              </div>
              <button
                type="submit"
                disabled={isGenerating || !(user?.remainingQuota && user.remainingQuota > 0)}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Generated Content</h2>
            {generatedContent && (
              <button
                onClick={downloadContent}
                className="btn-secondary flex items-center text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            )}
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-primary-600 mb-4" />
              <p className="text-gray-600">Generating SEO-optimized content...</p>
              <p className="text-sm text-gray-500 mt-2">This usually takes 10-30 seconds</p>
            </div>
          )}

          {generatedContent && !isGenerating && (
            <div className="space-y-6">
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Meta Title</h3>
                  <button
                    onClick={() => copyToClipboard(generatedContent.generatedContent.metaTitle, 'metaTitle')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedSection === 'metaTitle' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {generatedContent.generatedContent.metaTitle}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {generatedContent.generatedContent.metaTitle.length}/60 characters
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Meta Description</h3>
                  <button
                    onClick={() => copyToClipboard(generatedContent.generatedContent.metaDescription, 'metaDescription')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedSection === 'metaDescription' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {generatedContent.generatedContent.metaDescription}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {generatedContent.generatedContent.metaDescription.length}/160 characters
                </p>
              </div>

              {/* Blog Outline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Blog Outline</h3>
                  <button
                    onClick={() => copyToClipboard(generatedContent.generatedContent.blogOutline, 'blogOutline')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedSection === 'blogOutline' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {generatedContent.generatedContent.blogOutline}
                </div>
              </div>

              {/* Internal Links */}
              {generatedContent.generatedContent.internalLinks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Internal Links</h3>
                    <button
                      onClick={() => copyToClipboard(
                        generatedContent.generatedContent.internalLinks.map((link: any) => 
                          `${link.anchorText}: ${link.url}`
                        ).join('\n'),
                        'internalLinks'
                      )}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedSection === 'internalLinks' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {generatedContent.generatedContent.internalLinks.map((link: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md text-sm">
                        <div className="font-medium text-gray-900">{link.anchorText}</div>
                        <div className="text-gray-600 text-xs mt-1">{link.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Keywords */}
              {generatedContent.generatedContent.targetKeywords.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Target Keywords</h3>
                    <button
                      onClick={() => copyToClipboard(
                        generatedContent.generatedContent.targetKeywords.join(', '),
                        'targetKeywords'
                      )}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedSection === 'targetKeywords' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.generatedContent.targetKeywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generation Stats */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="ml-2 font-medium">{generatedContent.processingTime}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tokens Used:</span>
                    <span className="ml-2 font-medium">{generatedContent.tokensUsed}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!generatedContent && !isGenerating && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Fill in the form and click "Generate Content" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Generator
