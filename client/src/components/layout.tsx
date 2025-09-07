import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { UserRoundMinus } from 'lucide-react'
import { fetchUserOrganizations, fetchOrganizationDetails, leaveOrganization } from '@/api/organizations'
import { useToast } from '@/components/ui/toast-provider'

// const DotIcon = () => {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
//       <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
//     </svg>
//   )
// }

function Layout ({ children }: {
    children: ReactNode,
}) {
  const { getToken } = useAuth()
  const {} = useUser()
  const { showSuccess } = useToast()

  const handleOrgLeave = async () => {
    try {
      // 現在選択中のグループを取得
      const { lastSelectedOrganization } = await fetchUserOrganizations(getToken)
      if (!lastSelectedOrganization) {
        alert('現在参加中のグループが見つかりません。')
        return
      }

      const orgId = lastSelectedOrganization.id
      const { memberCount } = await fetchOrganizationDetails(orgId, getToken)

      const confirmMsg =
        memberCount === 1
          ? 'あなたは最後のメンバーです。この操作でグループが削除されます。よろしいですか？'
          : 'グループから離脱すると、明日以降の食事申し込みがすべて削除されます。よろしいですか？'

      if (!window.confirm(confirmMsg)) {
        return
      }

      // グループ離脱（最後のメンバーの場合はサーバー側でグループも削除される）
      await leaveOrganization(orgId, getToken)

      if (memberCount === 1) {
        showSuccess('グループを削除しました')
      } else {
        showSuccess('グループから離脱しました')
      }

      // ホームへリダイレクト
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to leave/delete organization', error)
      alert('グループからの離脱に失敗しました。')
    }
  }


  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">ごはんお願い</h1>
          <p className="text-lg text-muted-foreground">家族の食事申し込みを簡単管理</p>
        </div>
        <SignedOut>
	  <div className="flex justify-center mb-4">
            <SignInButton />
	  </div>
        </SignedOut>
        <SignedIn>
	  <div className="flex justify-center mb-4">
            <UserButton 
              userProfileProps={{
                appearance: {
                  elements: {
                    userProfileSection__dangerSection: { display: 'none' }
                  }
                }
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Action
                  label="グループから抜ける"
                  labelIcon={<UserRoundMinus className="text-destructive" />}
                  onClick={handleOrgLeave}
                />
              </UserButton.MenuItems>
            </UserButton>
	  </div>
	  { children }
        </SignedIn>
      </div>
    </main>
  )
};

export default Layout;
