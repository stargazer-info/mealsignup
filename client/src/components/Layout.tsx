import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useState } from 'react'
import { CreateOrganizationForm, JoinOrganizationForm } from './OrganizationForm'
import { fetchOrganizationDetails } from '../api/organizations'
import { leaveOrganization } from '../api/auth'

interface LayoutProps {
  organizations: any[];
  currentOrganization: any;
  setCurrentOrganization: (org: any) => void;
  showOrgSelector: boolean;
  showCreateOrg: boolean;
  showJoinOrg: boolean;
  loadUserOrganizations: () => void;
  setShowCreateOrg: (show: boolean) => void;
  setShowJoinOrg: (show: boolean) => void;
  setShowOrgSelector: (show: boolean) => void;
  switchOrganization: (organizationId: string) => void;
}

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  )
}

export const Layout = ({
  organizations,
  currentOrganization,
  setCurrentOrganization,
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
  
  // モーダル用の状態
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState<string | null>(null);
  const [currentOrgName, setCurrentOrgName] = useState<string | null>(null);

  const handleOrgLeave = async () => {
    try {
      const token = await getToken();
      const details = await fetchOrganizationDetails(currentOrganization.id, token);
      const memberCount = details.members ? details.members.length : 0;
      const confirmMsg = memberCount === 1 ? 
        `${currentOrganization.name}は削除されますがよろしいですか？` : 
        "本当に家族/店舗から抜けますか？";
      if (!window.confirm(confirmMsg)) return;
      
      await leaveOrganization(token);
      setCurrentOrganization(null);
      loadUserOrganizations();
    } catch (error) {
      console.error("Error leaving organization:", error);
    }
  };

  console.log('currentOrganization', currentOrganization)
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
                <UserButton>
		  {currentOrganization && (
		    <UserButton.MenuItems>
		      <UserButton.Action
			label="家族/店舗から抜ける"
			labelIcon={<DotIcon />}
			onClick={() => handleOrgLeave()}
		      >
		      </UserButton.Action>
		    </UserButton.MenuItems>
		  )}
                </UserButton>
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
                <h2 
                  className="cursor-pointer text-lg font-semibold text-text hover:underline" 
                  onClick={() => {
                    setCurrentInviteCode(currentOrganization.inviteCode);
                    setCurrentOrgName(currentOrganization.name);
                    setShowInviteModal(true);
                  }}
                >
                  {currentOrganization.name}
                </h2>
                <p className="text-sm text-gray-600">家族/店舗</p>
              </div>
            </div>
          )}

        </SignedIn>
        </div>
      </main>

      {/* 招待コード表示モーダル */}
      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">招待コード - {currentOrgName}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">
                ×
              </button>
            </div>
            <div className="text-center text-2xl font-mono bg-gray-100 p-4 rounded">
              {currentInviteCode}
            </div>
            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
