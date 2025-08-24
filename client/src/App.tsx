import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import Layout from "@/components/layout"
import GroupSetup from "@/components/group-setup"
import { fetchUserOrganizations, type OrganizationWithRole } from './api/organizations'

function App() {
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn, user } = useUser()
  const [currentView, setCurrentView] = useState<"application" | "summary">("application")
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [lastSelectedOrganization, setLastSelectedOrganization] = useState<OrganizationWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true)
      const { organizations, lastSelectedOrganization } = await fetchUserOrganizations(token);
      setOrganizations(organizations)
      setLastSelectedOrganization(lastSelectedOrganization)
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrganizations()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn, getToken])

  if (!isLoaded) {
    return <Layout children={<div>Loading...</div>} />
  }

  const orgToDisplay = lastSelectedOrganization || organizations[0]
  const groupData = orgToDisplay && user ? {
    id: orgToDisplay.id,
    name: orgToDisplay.name,
    userName: user.fullName || "",
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
