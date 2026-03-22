import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Zap, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  History
} from 'lucide-react'
import { seoAPI } from '../services/api'
import { useQuery } from '@tanstack/react-query'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: usageData } = useQuery({
    queryKey: ['usage'],
    queryFn: seoAPI.getUsage,
    refetchOnWindowFocus: false,
  })

  const stats = usageData?.data?.usage || {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    averageProcessingTime: 0,
    totalTokensUsed: 0,
    currentQuota: {
      used: 0,
      max: 5,
      remaining: 5
    }
  }

  const quotaPercentage = (stats.currentQuota.used / stats.currentQuota.max) * 100

  const features = [
    {
      icon: FileText,
      title: 'SEO Content Generation',
      description: 'Generate optimized blog outlines, meta titles, and descriptions',
      action: () => navigate('/generator')
    },
    {
      icon: History,
      title: 'Generation History',
      description: 'View and manage your past SEO content generations',
      action: () => navigate('/history')
    },
    {
      icon: BarChart3,
      title: 'Usage Analytics',
      description: 'Track your API usage and generation statistics',
      action: () => navigate('/profile')
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="mt-2 text-gray-600">
          Generate SEO-optimized content with AI-powered insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Generations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGenerations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successfulGenerations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageProcessingTime ? `${(stats.averageProcessingTime / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tokens Used</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTokensUsed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Usage Quota</h2>
          <span className="text-sm text-gray-500">
            {stats.currentQuota.remaining} of {stats.currentQuota.max} remaining
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              quotaPercentage > 80 ? 'bg-red-500' : quotaPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Free Plan</span>
          <button
            onClick={() => navigate('/generator')}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Generate Content
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Use specific keywords for better SEO optimization results</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Provide detailed topics to get more comprehensive content outlines</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Include target URLs when available for better internal linking suggestions</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard
