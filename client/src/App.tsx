import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { CreateOrganizationForm, JoinOrganizationForm } from './components/OrganizationForm'
import { MonthlySummary } from './components/MonthlySummary'
import { MealSignupForm } from './components/MealSignupForm'
import type { DailyData, DailyMealSignup } from './types/DailyData';
import { fetchMonthlySummary } from './api/monthlySummary'
import { fetchUserOrganizations, registerUserIfNeeded, switchOrganizationApi } from './api/organizations'
import { fetchMealSignup, saveMealSignupApi } from './api/meals'
import './App.css'

// ヘルパー関数
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${year}年${month}月${day}日（${weekdays[date.getDay()]}）`;
};

export const formatDateForAPI = (date: Date): string => date.toISOString().split('T')[0];

export const updateDate = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const updateMonth = (date: Date, offset: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
};

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
  const [monthlySummary, setMonthlySummary] = useState<{
    year: number;
    month: number;
    dailyData: DailyData[];
  } | null>(null)
  const [isEditingMealSignup, setIsEditingMealSignup] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthlyMealSignup, setMonthlyMealSignup] = useState<DailyMealSignup[]>([])


  // Register user if needed, then load organizations
  const loadUserOrganizations = async () => {
    try {
      const token = await getToken();
      let data;
      
      try {
        data = await fetchUserOrganizations(token);
      } catch (err) {
        // 404 だった場合は登録を試みる
        if (err.message.includes('404') || err.message.includes('User not found')) {
          setMessage('🔄 初回登録中...');
          await registerUserIfNeeded(token);
          setMessage('✅ 登録完了');
          data = await fetchUserOrganizations(token);
        } else {
          throw err;
        }
      }
      
      setOrganizations(data.organizations);
      setCurrentOrganization(data.lastSelectedOrganization);
      
      if (data.organizations.length === 0) {
        setShowOrgSelector(true);
      }
      setMessage(''); // Clear any registration messages
    } catch (error) {
      console.error('Error loading organizations:', error);
      setMessage(`❌ エラー: ${error.message || '接続エラーが発生しました'}`);
    }
  }

  // Load existing meal signup for current date
  const loadMealSignup = async () => {
    if (!currentOrganization) return;
    
    try {
      const token = await getToken();
      const dateStr = formatDateForAPI(currentDate);
      const data = await fetchMealSignup(dateStr, token);
      
      // Find current user's meal signup for this date
      const userSignup = data.mealSignups.find((signup: any) => signup.user);
      if (userSignup) {
        setMealSignup({
          breakfast: userSignup.breakfast,
          lunch: userSignup.lunch,
          dinner: userSignup.dinner
        });
      } else {
        // Reset to default if no signup found
        setMealSignup({ breakfast: false, lunch: false, dinner: false });
      }
    } catch (error) {
      console.error('Error loading meal signup:', error);
    }
  }


  // Save meal signup
  const saveMealSignup = async () => {
    if (!currentOrganization) {
      setMessage('❌ 組織が選択されていません');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = await getToken();
      await saveMealSignupApi(
        formatDateForAPI(currentDate),
        mealSignup,
        currentOrganization.id,
        token
      );
      setMessage('✅ 食事予定を保存しました');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ エラー: ${error.message}`);
      console.error('Error saving meal signup:', error);
    } finally {
      setLoading(false);
    }
  }

  // Switch organization
  const switchOrganization = async (organizationId: string) => {
    try {
      const token = await getToken();
      await switchOrganizationApi(organizationId, token);
      
      const selectedOrg = organizations.find((org: any) => org.id === organizationId);
      setCurrentOrganization(selectedOrg);
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  }

  // 月間サマリーの取得
  const loadMonthlySummary = async () => {
    if (!currentOrganization) return;
    try {
      const summary = await fetchMonthlySummary(currentOrganization, currentDate, getToken);
      setMonthlySummary(summary);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    }
  };

  // イベントハンドラー
  const handleMealSignupSave = async () => {
    try {
      await saveMealSignup();
      setIsEditingMealSignup(false);
      await loadMonthlySummary(); // 最新の月間サマリーを再取得
    } catch (error) {
      console.error('Error updating monthly summary:', error);
    }
  };

  const handleMealSignupCancel = () => {
    setIsEditingMealSignup(false);
    loadMealSignup();
  };

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

  useEffect(() => {
    loadMonthlySummary();
  }, [currentOrganization, currentDate, getToken]);

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
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto">
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
          {showOrgSelector && !showCreateOrg && !showJoinOrg && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">組織を選択してください</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowCreateOrg(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <span>➕</span>
                  <span>新しい組織を作成</span>
                </button>
                <button 
                  onClick={() => setShowJoinOrg(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <span>🔗</span>
                  <span>招待コードで参加</span>
                </button>
              </div>
            </div>
          )}

          {/* Create Organization Form */}
          {showCreateOrg && (
            <CreateOrganizationForm
              onSuccess={() => {
                setShowCreateOrg(false)
                setShowOrgSelector(false)
                loadUserOrganizations()
              }}
              onCancel={() => setShowCreateOrg(false)}
            />
          )}

          {/* Join Organization Form */}
          {showJoinOrg && (
            <JoinOrganizationForm
              onSuccess={() => {
                setShowJoinOrg(false)
                setShowOrgSelector(false)
                loadUserOrganizations()
              }}
              onCancel={() => setShowJoinOrg(false)}
            />
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

        </SignedIn>

        {/* 月間サマリー表示と編集ボタン */}
        {currentOrganization && monthlySummary && !isEditingMealSignup && (
          <div className="w-full mb-6">
            <MonthlySummary monthlySummary={monthlySummary} />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setIsEditingMealSignup(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                編集
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto">


          {/* 編集モードの食事予約フォーム */}
          {currentOrganization && isEditingMealSignup && (
            <MealSignupForm 
              monthlyMealSignup={monthlyMealSignup}
              setMonthlyMealSignup={setMonthlyMealSignup}
              onSave={handleMealSignupSave}
              onCancel={handleMealSignupCancel}
              loading={loading}
              message={message}
              currentMonth={currentMonth}
              changeMonth={(offset) => setCurrentMonth(updateMonth(currentMonth, offset))}
              organizationId={currentOrganization.id}
              getToken={getToken}
            />
          )}
	  
        </div>
        </div>
      </main>
    </div>
  )
}

export default App
