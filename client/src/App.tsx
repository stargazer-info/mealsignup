import { useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import { MonthlySummary } from './components/MonthlySummary'
import { MealSignupForm } from './components/MealSignupForm'
import type { DailyData, DailyMealSignup } from './types/DailyData';
import { fetchMonthlySummary } from './api/monthlySummary'
import { fetchUserOrganizations } from './api/organizations'
import { switchOrganizationApi, registerUserIfNeeded } from './api/auth'
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
  const { isLoaded, isSignedIn, user } = useUser()
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
  const [isEditingMealSignup, setIsEditingMealSignup] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthlyMealSignup, setMonthlyMealSignup] = useState<DailyMealSignup[]>([])


  // Load user organizations
  const loadUserOrganizations = async () => {
    try {
      const token = await getToken();
      
      console.log('🔍 組織情報を取得中...');
      const data = await fetchUserOrganizations(token);
      console.log('✅ 組織情報取得成功');
      
      setOrganizations(data.organizations);
      setCurrentOrganization(data.lastSelectedOrganization);
      
      if (data.organizations.length === 0) {
        setShowOrgSelector(true);
      }
      setMessage(''); // Clear any messages
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      if (error.message.includes('404') || error.message.includes('User not found') || error.message.includes('Not Found')) {
        setMessage('❌ ユーザーが見つかりません。サインアップしてください。');
      } else {
        setMessage(`❌ エラー: ${error.message || '接続エラーが発生しました'}`);
      }
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
      // 月間サマリーを強制的に再取得
      if (currentOrganization) {
        const summary = await fetchMonthlySummary(currentOrganization, currentMonth, getToken);
        setMonthlySummary(summary);
      }
      setIsEditingMealSignup(false);
    } catch (error) {
      console.error('Error updating monthly summary:', error);
      setIsEditingMealSignup(false); // エラーでも画面遷移は行う
    }
  };

  const handleMealSignupCancel = () => {
    setIsEditingMealSignup(false);
    loadMealSignup();
  };

  // 初回表示時のログインチェック
  useEffect(() => {
    if (!isLoaded) return; // Clerkの情報が読み込まれるまで待つ
 
    if (!isSignedIn) {
      // 未ログインの場合はメッセージ表示などで誘導する
      setMessage('サインインしてください。')
    } else {
      // ログイン済みの場合は、まずユーザー登録処理を実行してから組織情報をロードする
      const init = async () => {
        try {
          const token = await getToken();
          await registerUserIfNeeded(token);
          await loadUserOrganizations();
        } catch (error) {
          console.error('初期化エラー:', error);
          setMessage(`エラー: ${error.message || '読み込み失敗'}`);
        }
      }
      init();
    }
  }, [isLoaded, isSignedIn])

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
    <>
      <Layout
        organizations={organizations}
        currentOrganization={currentOrganization}
        setCurrentOrganization={setCurrentOrganization}
        showOrgSelector={showOrgSelector}
        showCreateOrg={showCreateOrg}
        showJoinOrg={showJoinOrg}
        loadUserOrganizations={loadUserOrganizations}
        setShowCreateOrg={setShowCreateOrg}
        setShowJoinOrg={setShowJoinOrg}
        setShowOrgSelector={setShowOrgSelector}
        switchOrganization={switchOrganization}
      />
      
      {/* App固有のコンテンツ */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* 食事予約フォーム */}
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

          {/* 月間サマリー表示 */}
          {currentOrganization && !isEditingMealSignup && monthlySummary && (
            <MonthlySummary 
              monthlySummary={monthlySummary} 
              onEdit={() => setIsEditingMealSignup(true)}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default App
