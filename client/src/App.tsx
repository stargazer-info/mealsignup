import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { MealApplicationTable } from "@/components/meal-application-table"
import GroupSummary from "@/components/group-summary"
import Layout from "@/components/layout"
import GroupSetup from "@/components/group-setup"
import UserNameInput from '@/components/user-name-input'
import LandingPage from '@/components/landing-page'
import { fetchUserOrganizations, type OrganizationWithRole } from './api/organizations'
import { fetchWithRefresh, apiUrl } from './api/index'
import GroupContextHeader from "@/components/group-context-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { GroupData } from "@/types/GroupData"

function App() {
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn, user } = useUser()
  const [activeTab, setActiveTab] = useState<"application" | "summary">("summary")
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [lastSelectedOrganization, setLastSelectedOrganization] = useState<OrganizationWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [displayName, setDisplayName] = useState<string>('')

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const handleYearMonthChange = useCallback((year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }, [])

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
        if (isLoaded && isSignedIn) setIsLoading(false)
      }
    }
    if (isLoaded && isSignedIn) {
      loadDisplayName()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn])

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
      setDisplayName(name.trim())
    } catch (e) {
      console.error('Failed to save displayName:', e)
      alert('表示名の保存に失敗しました。時間をおいて再度お試しください。')
    }
  }

  if (!isLoaded) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    )
  }

  const orgToDisplay = lastSelectedOrganization || organizations[0]
  const groupData: GroupData | null = orgToDisplay && user ? {
    id: orgToDisplay.id,
    name: orgToDisplay.name,
    userName: (displayName || user.fullName || ""),
    inviteCode: orgToDisplay.inviteCode,
  } : null

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        {isLoading ? (
          <Layout>
            <div>Loading...</div>
          </Layout>
        ) : !displayName ? (
          <Layout>
            <div className="mx-auto max-w-md p-2 sm:p-0">
              <UserNameInput onUserNameSet={handleSetDisplayName} initialValue="" />
            </div>
          </Layout>
        ) : (
          <Layout>
            {organizations.length === 0 ? (
              <GroupSetup onGroupSetup={fetchOrganizations} />
            ) : groupData ? (
              <GroupContextHeader
                groupData={groupData}
                year={selectedYear}
                month={selectedMonth}
                onYearMonthChange={handleYearMonthChange}
              >
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "application" | "summary")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                    <TabsTrigger value="summary">集計</TabsTrigger>
                    <TabsTrigger value="application">注文</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary" className="mt-6">
                    <GroupSummary
                      groupData={groupData}
                      year={selectedYear}
                      month={selectedMonth}
                    />
                  </TabsContent>
                  <TabsContent value="application" className="mt-6">
                    <MealApplicationTable
                      groupData={groupData}
                      year={selectedYear}
                      month={selectedMonth}
                    />
                  </TabsContent>
                </Tabs>
              </GroupContextHeader>
            ) : (
              <div className="text-center text-muted-foreground">所属グループが見つかりません。</div>
            )}
          </Layout>
        )}
      </SignedIn>
    </>
  )
}

export default App
