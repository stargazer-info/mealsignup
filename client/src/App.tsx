import { useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import './App.css'
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import GroupSetup from "@/components/group-setup"
import Layout from "@/components/layout"
import { fetchUserOrganizations, OrganizationWithRole } from './api/organizations'

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

  if (!isLoaded || isLoading) {
    return <Layout children={<div>Loading...</div>} />
  }

  if (!isSignedIn || organizations.length === 0) {
    return <GroupSetup onGroupSetup={fetchOrganizations} />
  }

  const orgToDisplay = lastSelectedOrganization || organizations[0]
  const groupData = orgToDisplay && user ? {
    name: orgToDisplay.name,
    userName: user.fullName || "",
    inviteCode: orgToDisplay.inviteCode,
  } : null

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
	<Layout children={ currentView === "application" ? (
            <MealApplicationTable onNavigateToSummary={() => setCurrentView("summary")} groupData={groupData} />
        ) : (
          <GroupSummary onBack={() => setCurrentView("application")} groupData={groupData} />
        )} />
      </div>
    </main>
  )
}

export default App
