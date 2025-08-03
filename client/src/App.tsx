import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const { getToken } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealSignup, setMealSignup] = useState({
    breakfast: false,
    lunch: false,
    dinner: false
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [currentOrganization, setCurrentOrganization] = useState(null)
  const [showOrgSelector, setShowOrgSelector] = useState(false)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showJoinOrg, setShowJoinOrg] = useState(false)

  // Format date for display
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）`
  }

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Register user if needed, then load organizations
  const loadUserOrganizations = async () => {
    try {
      const token = await getToken()
      
      // Try to get organizations first
      let response = await fetch('http://localhost:3001/api/organizations/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // If user not found, register them first
      if (response.status === 404) {
        setMessage('🔄 初回登録中...')
        
        const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (registerResponse.ok) {
          setMessage('✅ 登録完了')
          // Try getting organizations again after registration
          response = await fetch('http://localhost:3001/api/organizations/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } else {
          const registerError = await registerResponse.json()
          if (registerResponse.status === 400 && registerError.error === 'User already exists') {
            // User exists but organizations call failed - retry
            response = await fetch('http://localhost:3001/api/organizations/me', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          } else {
            setMessage(`❌ 登録エラー: ${registerError.error}`)
            return
          }
        }
      }
      
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations)
        setCurrentOrganization(data.lastSelectedOrganization)
        
        if (data.organizations.length === 0) {
          setShowOrgSelector(true)
        }
        setMessage('') // Clear any registration messages
      } else {
        const errorData = await response.json()
        setMessage(`❌ エラー: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      setMessage('❌ 接続エラーが発生しました')
    }
  }

  // Load existing meal signup for current date
  const loadMealSignup = async () => {
    if (!currentOrganization) return
    
    try {
      const token = await getToken()
      const dateStr = formatDateForAPI(currentDate)
      const response = await fetch(`http://localhost:3001/api/meals?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Find current user's meal signup for this date
        const userSignup = data.mealSignups.find((signup: any) => signup.user)
        if (userSignup) {
          setMealSignup({
            breakfast: userSignup.breakfast,
            lunch: userSignup.lunch,
            dinner: userSignup.dinner
          })
        } else {
          // Reset to default if no signup found
          setMealSignup({ breakfast: false, lunch: false, dinner: false })
        }
      }
    } catch (error) {
      console.error('Error loading meal signup:', error)
    }
  }

  // Save meal signup
  const saveMealSignup = async () => {
    if (!currentOrganization) {
      setMessage('❌ 組織が選択されていません')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const token = await getToken()
      const response = await fetch('http://localhost:3001/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: formatDateForAPI(currentDate),
          breakfast: mealSignup.breakfast,
          lunch: mealSignup.lunch,
          dinner: mealSignup.dinner,
          organizationId: currentOrganization.id
        })
      })

      if (response.ok) {
        setMessage('✅ 食事予定を保存しました')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`❌ エラー: ${error.error}`)
      }
    } catch (error) {
      setMessage('❌ 保存に失敗しました')
      console.error('Error saving meal signup:', error)
    } finally {
      setLoading(false)
    }
  }

  // Switch organization
  const switchOrganization = async (organizationId: string) => {
    try {
      const token = await getToken()
      await fetch(`http://localhost:3001/api/organizations/select/${organizationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const selectedOrg = organizations.find(org => org.id === organizationId)
      setCurrentOrganization(selectedOrg)
    } catch (error) {
      console.error('Error switching organization:', error)
    }
  }

  // Navigate dates
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  // Load organizations on mount
  useEffect(() => {
    loadUserOrganizations()
  }, [])

  // Load meal signup when date or organization changes
  useEffect(() => {
    if (currentOrganization) {
      loadMealSignup()
    }
  }, [currentDate, currentOrganization])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">MealSignup</h1>
            <div className="flex items-center space-x-2">
              {organizations.length > 1 && currentOrganization && (
                <select 
                  value={currentOrganization?.id || ''}
                  onChange={(e) => switchOrganization(e.target.value)}
                  className="ml-2 p-1 border rounded text-sm"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <SignedOut>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to MealSignup</h2>
            <p className="text-gray-600 mb-4">Please sign in to manage your family's meal planning.</p>
            <SignInButton>
              <button className="bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Organization Selection */}
          {showOrgSelector && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">組織を選択してください</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowCreateOrg(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  新しい組織を作成
                </button>
                <button 
                  onClick={() => setShowJoinOrg(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  招待コードで参加
                </button>
              </div>
            </div>
          )}

          {/* Current Organization Display */}
          {currentOrganization && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-text">{currentOrganization.name}</h2>
                <p className="text-sm text-gray-600">{currentOrganization.type === 'FAMILY' ? '家族' : '店舗'}</p>
              </div>
            </div>
          )}

          {/* Date Navigation */}
          {currentOrganization && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => changeDate(-1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
              <div className="text-center">
                <div className="text-lg font-semibold text-text">📅 {formatDate(currentDate)}</div>
              </div>
              <button 
                onClick={() => changeDate(1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
	  )}

          {/* Meal Signup Form */}
          {currentOrganization && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-6">今日の食事予定：</h2>
            
            <div className="space-y-4">
              {/* Breakfast */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌅</span>
                  <span className="text-lg font-medium text-text">朝食</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mealSignup.breakfast}
                    onChange={(e) => setMealSignup({...mealSignup, breakfast: e.target.checked})}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-text">必要</span>
                </label>
              </div>

              {/* Lunch */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌞</span>
                  <span className="text-lg font-medium text-text">昼食</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mealSignup.lunch}
                    onChange={(e) => setMealSignup({...mealSignup, lunch: e.target.checked})}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-text">必要</span>
                </label>
              </div>

              {/* Dinner */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌙</span>
                  <span className="text-lg font-medium text-text">夕食</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={mealSignup.dinner}
                    onChange={(e) => setMealSignup({...mealSignup, dinner: e.target.checked})}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-text">必要</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={saveMealSignup}
              disabled={loading}
              className="w-full mt-6 bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>💾</span>
              <span>{loading ? '保存中...' : '保存する'}</span>
            </button>

            {/* Message */}
            {message && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 text-center text-sm">
                {message}
              </div>
            )}
          </div>
	  )}
	  
          {/* Organization Overview Link */}
          {currentOrganization && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <button className="w-full flex items-center justify-center space-x-2 text-secondary hover:text-teal-600 font-medium transition-colors">
                <span>{currentOrganization.type === 'FAMILY' ? '👨‍👩‍👧‍👦' : '🏪'}</span>
                <span>{currentOrganization.type === 'FAMILY' ? '家族の予定を見る' : '店舗の予定を見る'}</span>
              </button>
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  )
}

export default App
