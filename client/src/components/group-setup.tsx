"use client"

import { useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Users, Plus, Key } from "lucide-react"
import { createOrganization, joinOrganization } from "@/api/organizations"

interface GroupSetupProps {
  onGroupSetup: () => Promise<void>
}

export default function GroupSetup({ onGroupSetup }: GroupSetupProps) {
  const { getToken } = useAuth()
  const {} = useUser()
  const [activeTab, setActiveTab] = useState("create")
  const [groupName, setGroupName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateGroup = async () => {
    setError(null)
    if (groupName.trim()) {
      setIsLoading(true);
      const token = await getToken();
      if (!token) { setIsLoading(false); return; }
      try {
        await createOrganization(groupName, token)
        await onGroupSetup()
      } catch (error) { console.error("Failed to create group:", error); }
      finally { setIsLoading(false); }
    }
  }

  const handleJoinGroup = async () => {
    setError(null)
    if (inviteCode.trim()) {
      setIsLoading(true);
      const token = await getToken();
      if (!token) { setIsLoading(false); return; }
      try {
        await joinOrganization(inviteCode, token)
        await onGroupSetup()
      } catch (error) {
        setError("招待コードが正しくないか、既にグループに参加しています。")
        console.error("Failed to join group:", error);
      }
      finally { setIsLoading(false); }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
          <CardHeader>
            <CardTitle className="text-center">グループの設定</CardTitle>
            <CardDescription className="text-center">
              新しいグループを作成するか、既存のグループに参加してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setError(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  作成
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  参加
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName">グループ名</Label>
                  <Input
                    id="groupName"
                    placeholder="田中ファミリー"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full" disabled={!groupName.trim() || isLoading}>
                  <Users className="h-4 w-4 mr-2" />
                  {isLoading ? '作成中...' : 'グループを作成'}
                </Button>
              </TabsContent>

              <TabsContent value="join" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">招待コード</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABCDEFGH"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                    maxLength={8}
                  />
                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                </div>
                <Button onClick={handleJoinGroup} className="w-full" disabled={!inviteCode.trim() || isLoading}>
                  <Key className="h-4 w-4 mr-2" />
                  {isLoading ? '参加中...' : 'グループに参加'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
    </div>
  )
}
