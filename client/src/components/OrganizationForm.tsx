import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

interface OrganizationFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateOrganizationForm({ onSuccess, onCancel }: OrganizationFormProps) {
  const { getToken } = useAuth()
  const [formData, setFormData] = useState({
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('組織名を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await getToken()
      const response = await fetch('http://localhost:3001/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || '組織の作成に失敗しました')
      }
    } catch (error) {
      setError('接続エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">新しい組織を作成</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            組織名
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="例: 田中家"
            disabled={loading}
          />
        </div>


        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '作成中...' : '作成する'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}

export function JoinOrganizationForm({ onSuccess, onCancel }: OrganizationFormProps) {
  const { getToken } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) {
      setError('招待コードを入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = await getToken()
      const response = await fetch('http://localhost:3001/api/organizations/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || '組織への参加に失敗しました')
      }
    } catch (error) {
      setError('接続エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">組織に参加</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            招待コード
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-center text-lg font-mono tracking-wider"
            placeholder="例: ABC12345"
            disabled={loading}
            maxLength={8}
          />
          <p className="text-sm text-gray-500 mt-1">
            組織の管理者から受け取った8文字のコードを入力してください
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="flex-1 bg-primary hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '参加中...' : '参加する'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
