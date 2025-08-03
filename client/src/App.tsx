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

  // Load existing meal signup for current date
  const loadMealSignup = async () => {
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
          dinner: mealSignup.dinner
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

  // Navigate dates
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  // Load meal signup when date changes
  useEffect(() => {
    loadMealSignup()
  }, [currentDate])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">MealSignup</h1>
            <div className="flex items-center space-x-2">
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
          {/* Date Navigation */}
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

          {/* Meal Signup Form */}
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

          {/* Family Overview Link */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button className="w-full flex items-center justify-center space-x-2 text-secondary hover:text-teal-600 font-medium transition-colors">
              <span>👨‍👩‍👧‍👦</span>
              <span>家族の予定を見る</span>
            </button>
          </div>
        </SignedIn>
      </main>
    </div>
  )
}

export default App
