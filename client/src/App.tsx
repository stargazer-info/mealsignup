import { useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import './App.css'
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import GroupSetup from "@/components/group-setup"
import Layout from "@/components/layout"

function App() {
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn, user } = useUser()
  //  const [currentView, setCurrentView] = useState<"setup" | "application" | "summary">("setup")
  const [currentView, setCurrentView] = useState<"setup" | "application" | "summary">("application")
  const [groupData, setGroupData] = useState<{
    name: string
    userName: string
    inviteCode: string
  } | null>(null)

  const handleGroupSetup = (data: { name: string; userName: string; inviteCode: string }) => {
    setGroupData(data)
    setCurrentView("application")
  }

  if (currentView === "setup") {
    return <GroupSetup onGroupSetup={handleGroupSetup} />
  }

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
