import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import Layout from "@/components/layout"
import GroupSetup from "@/components/group-setup"
import UserNameInput from '@/components/user-name-input'
import { fetchUserOrganizations, type OrganizationWithRole } from './api/organizations'
import { fetchWithRefresh, apiUrl } from './api/index'

function App() {
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn, user } = useUser()
  const [currentView, setCurrentView] = useState<"application" | "summary">("application")
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [lastSelectedOrganization, setLastSelectedOrganization] = useState<OrganizationWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // DB一本化: 表示名はDBから取得・管理
  const [displayName, setDisplayName] = useState<string>('')

  // 共通の年月 state
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const handleYearMonthChange = useCallback((year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }, [])

  // getToken を安定参照に
  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true)
      const { organizations, lastSelectedOrganization } = await fetchUserOrganizations(getTokenRef.current)
      setOrganizations(organizations)
      setLastSelectedOrganization(lastSelectedOrganization as OrganizationWithRole | null)
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  // DBからdisplayNameを取得（Clerkに依存しない）
  useEffect(() => {
    const loadDisplayName = async () => {
      try {
        const resp = await fetchWithRefresh(apiUrl.me.getDisplayName(), {}, getTokenRef.current)
        if (resp.ok) {
          const json = await resp.json()
          setDisplayName(json.displayName || '')
        }
      } catch (e) {
        console.error('Failed to fetch displayName from DB', e)
      } finally {
        // displayName 未設定でも入力カードを出せるようロードを解除
        if (isLoaded && isSignedIn) setIsLoading(false)
      }
    }
    if (isLoaded && isSignedIn) {
      loadDisplayName()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn])

  // displayName が取得できたら組織を読み込む
  useEffect(() => {
    if (isLoaded && isSignedIn && displayName) {
      fetchOrganizations()
    }
  }, [isLoaded, isSignedIn, displayName])

  const handleSetDisplayName = async (name: string) => {
    if (!user) return
    try {
      const response = await fetchWithRefresh(apiUrl.me.updateDisplayName(), {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name.trim() }),
      }, getTokenRef.current)
      if (!response.ok) throw new Error('Failed to update display name')
      // DBに保存済み。Clerkのreloadは不要
      setDisplayName(name.trim())
    } catch (e) {
      console.error('Failed to save displayName:', e)
      alert('表示名の保存に失敗しました。時間をおいて再度お試しください。')
    }
  }

  if (!isLoaded) {
    return <Layout children={<div>Loading...</div>} />
  }

  const orgToDisplay = lastSelectedOrganization || organizations[0]
  const groupData = orgToDisplay && user ? {
    id: orgToDisplay.id,
    name: orgToDisplay.name,
    userName: (displayName || user.fullName || ""),
    inviteCode: orgToDisplay.inviteCode,
  } : null

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">ごはんお願い</h1>
            <p className="text-lg text-muted-foreground mb-8">家族の食事申し込みを簡単管理</p>
            <SignInButton mode="modal">
              <Button>サインイン</Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        {isLoading ? (
          <Layout children={<div>Loading...</div>} />
        ) : !displayName ? (
          <Layout children={
            <div className="mx-auto max-w-md p-2 sm:p-0">
              <UserNameInput onUserNameSet={handleSetDisplayName} initialValue="" />
            </div>
          } />
        ) : (
          <Layout children={
            organizations.length === 0 ? (
              <GroupSetup onGroupSetup={fetchOrganizations} />
            ) : (
              currentView === "application" ? (
                <MealApplicationTable
                  onNavigateToSummary={() => setCurrentView("summary")}
                  groupData={groupData}
                  year={selectedYear}
                  month={selectedMonth}
                  onYearMonthChange={handleYearMonthChange}
                />
              ) : (
                <GroupSummary
                  onBack={() => setCurrentView("application")}
                  groupData={groupData}
                  year={selectedYear}
                  month={selectedMonth}
                  onYearMonthChange={handleYearMonthChange}
                />
              )
            )
          } />
        )}
      </SignedIn>
    </>
  )
}

export default App
