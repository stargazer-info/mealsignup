import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import Layout from "@/components/layout"
import GroupSetup from "@/components/group-setup"
import UserNameInput from '@/components/user-name-input'
import { fetchUserOrganizations, type OrganizationWithRole } from './api/organizations'
import { apiUrl } from './api/index'

function App() {
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn, user } = useUser()
  const [currentView, setCurrentView] = useState<"application" | "summary">("application")
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [lastSelectedOrganization, setLastSelectedOrganization] = useState<OrganizationWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const displayName = (user?.publicMetadata as any)?.displayName as string | undefined

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true)
      const { organizations, lastSelectedOrganization } = await fetchUserOrganizations(getToken);
      setOrganizations(organizations)
      setLastSelectedOrganization(lastSelectedOrganization as OrganizationWithRole | null)
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn && displayName) {
      fetchOrganizations()
    } else if (isLoaded) {
      // サインイン済みでも displayName 未設定ならローディングを解除して入力カードを表示
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn, displayName, getToken])

  const handleSetDisplayName = async (name: string) => {
    if (!user) return
    try {
      const response = await fetchWithRefresh(apiUrl.me.updateDisplayName(), {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name.trim() }),
      }, () => getToken())
      if (!response.ok) throw new Error('Failed to update display name');
      await user.reload()
      // reload 後、displayName が反映され useEffect が fetchOrganizations を走らせる
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
        {!displayName ? (
          <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
              <Layout children={
                <div className="mx-auto max-w-md">
                  <UserNameInput onUserNameSet={handleSetDisplayName} initialValue={user?.fullName || ""} />
                </div>
              } />
            </div>
          </main>
        ) : isLoading ? (
          <Layout children={<div>Loading...</div>} />
        ) : (
          <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
              <Layout children={
                organizations.length === 0 ? (
                  <GroupSetup onGroupSetup={fetchOrganizations} />
                ) : (
                  currentView === "application" ? (
                    <MealApplicationTable onNavigateToSummary={() => setCurrentView("summary")} groupData={groupData} />
                  ) : (
                    <GroupSummary onBack={() => setCurrentView("application")} groupData={groupData} />
                  )
                )
              } />
            </div>
          </main>
        )}
      </SignedIn>
    </>
  )
}

export default App
