import { useAuth } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import { MonthlySummary } from './components/MonthlySummary'
import { MealSignupForm } from './components/MealSignupForm'
import type { DailyData, DailyMealSignup } from './types/DailyData';
import { fetchMonthlySummary } from './api/monthlySummary'
import { fetchUserOrganizations, switchOrganizationApi } from './api/organizations'
import { registerUserIfNeeded } from './api/auth'
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
  const [isEditingMealSignup, setIsEditingMealSignup] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthlyMealSignup, setMonthlyMealSignup] = useState<DailyMealSignup[]>([])


  // Register user if needed, then load organizations
  const loadUserOrganizations = async () => {
    try {
      const token = await getToken();
      let data;
      
      try {
        console.log('🔍 組織情報を取得中...');
        data = await fetchUserOrganizations(token);
        console.log('✅ 組織情報取得成功');
      } catch (err) {
        console.log('⚠️ 組織情報取得エラー:', err.message);
        // 404 だった場合は登録を試みる
        if (err.message.includes('404') || err.message.includes('User not found') || err.message.includes('Not Found')) {
          console.log('🔄 初回ユーザー登録を開始...');
          setMessage('🔄 初回登録中...');
          
          try {
            await registerUserIfNeeded(token);
            console.log('✅ ユーザー登録完了');
            setMessage('✅ 登録完了 - 組織情報を再取得中...');
            
            // 少し待ってから再取得（データベース反映待ち）
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('🔄 組織情報を再取得中...');
            data = await fetchUserOrganizations(token);
            console.log('✅ 組織情報再取得成功');
          } catch (registerError) {
            console.error('❌ ユーザー登録エラー:', registerError);
            throw new Error(`登録エラー: ${registerError.message}`);
          }
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
      console.error('❌ Error loading organizations:', error);
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
