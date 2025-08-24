import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { UserRoundMinus, Trash } from 'lucide-react'
import { fetchUserOrganizations, fetchOrganizationDetails, leaveOrganization, deleteOrganization } from '@/api/organizations'
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
  const { user } = useUser()
  const { showSuccess } = useToast()

  // グループ離脱の共通処理（トーストとリダイレクトなし）
  const performOrgLeave = async () => {
    try {
      const token = await getToken()
      if (!token) throw new Error('認証トークンが取得できません')

      const { lastSelectedOrganization } = await fetchUserOrganizations(token)
      if (!lastSelectedOrganization) {
        // グループに参加していない場合はスキップ
        return { memberCount: 0 }
      }

      const orgId = lastSelectedOrganization.id
      const { memberCount } = await fetchOrganizationDetails(orgId, token)
      await leaveOrganization(orgId, token)

      return { memberCount }
    } catch (error) {
      // 403エラーの場合はグループが存在しないものとして処理
      if (error.message?.includes('403')) {
        return { memberCount: 0 }
      }
      throw error
    }
  }

  const handleOrgLeave = async () => {
    try {
      const token = await getToken()
      if (!token) return

      // 現在選択中のグループを取得
      const { lastSelectedOrganization } = await fetchUserOrganizations(token)
      if (!lastSelectedOrganization) {
        alert('現在参加中のグループが見つかりません。')
        return
      }

      const orgId = lastSelectedOrganization.id
      const { memberCount } = await fetchOrganizationDetails(orgId, token)

      const confirmMsg =
        memberCount === 1
          ? 'あなたは最後のメンバーです。この操作でグループが削除されます。よろしいですか？'
          : 'グループから離脱すると、明日以降の食事申し込みがすべて削除されます。よろしいですか？'

      if (!window.confirm(confirmMsg)) {
        return
      }

      const { memberCount: resultMemberCount } = await performOrgLeave()

      if (resultMemberCount === 1) {
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

  const handleUserDelete = async () => {
    if (!window.confirm('アカウントを完全に削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      // 1. グループ離脱処理を実行
      await performOrgLeave()

      // 2. Clerkユーザー削除（再認証付き）
      await user?.delete({
        redirectUrl: window.location.origin
      })
    } catch (error) {
      if (error.errors?.[0]?.code === 'session_reverification_required') {
        alert('アカウント削除には追加認証が必要です。パスワードを再入力してください。')
        // Clerkが自動的に再認証画面を表示します
      } else {
        console.error('Failed to delete user', error)
        alert('アカウント削除に失敗しました。')
      }
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
                  className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                />
                <UserButton.Action
                  label="アカウントを削除"
                  labelIcon={<Trash className="h-4 w-4 text-destructive" />}
                  onClick={handleUserDelete}
                  className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
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
