import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { CreateOrganizationForm, JoinOrganizationForm } from './OrganizationForm'
import { fetchOrganizationDetails, updateUserProfile, deleteOrganization } from '../api/organizations'

interface LayoutProps {
  organizations: any[];
  currentOrganization: any;
  showOrgSelector: boolean;
  showCreateOrg: boolean;
  showJoinOrg: boolean;
  loadUserOrganizations: () => void;
  setShowCreateOrg: (show: boolean) => void;
  setShowJoinOrg: (show: boolean) => void;
  setShowOrgSelector: (show: boolean) => void;
  switchOrganization: (organizationId: string) => void;
}

export const Layout = ({
  organizations,
  currentOrganization,
  showOrgSelector,
  showCreateOrg,
  showJoinOrg,
  loadUserOrganizations,
  setShowCreateOrg,
  setShowJoinOrg,
  setShowOrgSelector,
  switchOrganization,
}: LayoutProps) => {

  const { getToken } = useAuth(); // Ensure getToken is available from Clerk if not already imported

  const handleOrgLeave = async () => {
    try {
      const token = await getToken();
      const details = await fetchOrganizationDetails(currentOrganization.id, token);
      const memberCount = details.members ? details.members.length : 0;
      const confirmMsg = memberCount === 1 ? 
        `${currentOrganization.name}は削除されますがよろしいですか？` : 
        "本当に家族/店舗から抜けますか？";
      if (!window.confirm(confirmMsg)) return;
      if (memberCount === 1) {
        await deleteOrganization(currentOrganization.id, token);
      }
      await updateUserProfile({ lastSelectedOrganizationId: null }, token);
      setCurrentOrganization(null);
      loadUserOrganizations();
    } catch (error) {
      console.error("Error leaving organization:", error);
    }
  };

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
                <button 
                  onClick={handleOrgLeave} 
                  className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  家族/店舗から抜ける
                </button>
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
                <p className="text-sm text-gray-600">家族/店舗</p>
              </div>
            </div>
          )}

        </SignedIn>
        </div>
      </main>
    </div>
  );
};

export default Layout;
