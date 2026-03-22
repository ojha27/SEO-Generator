import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { seoAPI } from '../services/api'
import { 
  User, 
  Mail, 
  Calendar, 
  BarChart3, 
  Zap, 
  Crown,
  Settings,
  LogOut,
  CreditCard,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  
  const { data: usageData } = useQuery({
    queryKey: ['usage'],
    queryFn: seoAPI.getUsage,
    refetchOnWindowFocus: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
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

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // TODO: Implement profile update API
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      updateUser({ username: data.username, email: data.email })
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    reset({
      username: user?.username || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatProcessingTime = (time: number) => {
    return `${(time / 1000).toFixed(1)}s`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and view usage statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Edit Profile
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-gray-900">{user?.username}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="flex items-center mt-1">
                      {user?.subscriptionTier === 'pro' ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Free Plan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Login
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.lastLogin ? formatDate(user.lastLogin) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    className="input"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="input"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
              {user?.subscriptionTier === 'free' && (
                <button className="btn-primary text-sm">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Upgrade
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                {user?.subscriptionTier === 'pro' ? (
                  <Crown className="h-8 w-8 text-purple-600 mr-3" />
                ) : (
                  <Zap className="h-8 w-8 text-blue-600 mr-3" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.subscriptionTier === 'pro' 
                      ? 'Unlimited generations' 
                      : `${user?.usageQuota || 5} generations per month`
                    }
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Usage This Month</span>
                  <span>{stats.currentQuota.used}/{stats.currentQuota.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      quotaPercentage > 80 ? 'bg-red-500' : quotaPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${quotaPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Generations</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats.totalGenerations}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Success Rate</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalGenerations > 0 
                    ? `${Math.round((stats.successfulGenerations / stats.totalGenerations) * 100)}%`
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-600">Avg. Processing Time</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.averageProcessingTime ? formatProcessingTime(stats.averageProcessingTime) : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Tokens Used</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalTokensUsed.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </button>
              <button className="w-full btn-secondary text-left flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & Payments
              </button>
              <button 
                onClick={logout}
                className="w-full btn-secondary text-left flex items-center text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
