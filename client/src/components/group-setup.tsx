"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Users, Plus, Key } from "lucide-react"

interface GroupSetupProps {
  onGroupSetup: (groupData: { name: string; userName: string; inviteCode: string }) => void
}

export default function GroupSetup({ onGroupSetup }: GroupSetupProps) {
  const [activeTab, setActiveTab] = useState("create")
  const [groupName, setGroupName] = useState("")
  const [userName, setUserName] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  const handleCreateGroup = () => {
    if (groupName.trim() && userName.trim()) {
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      onGroupSetup({
        name: groupName,
        userName: userName,
        inviteCode: newInviteCode,
      })
    }
  }

  const handleJoinGroup = () => {
    if (inviteCode.trim() && userName.trim()) {
      // 実際のアプリでは招待コードを検証してグループ情報を取得
      onGroupSetup({
        name: "参加したグループ", // 実際は招待コードから取得
        userName: userName,
        inviteCode: inviteCode,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">ごはんお願い</h1>
          <p className="text-lg text-muted-foreground">家族の食事申し込みを簡単管理</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">グループの設定</CardTitle>
            <CardDescription className="text-center">
              新しいグループを作成するか、既存のグループに参加してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                <div className="space-y-2">
                  <Label htmlFor="userName">あなたの名前</Label>
                  <Input
                    id="userName"
                    placeholder="田中太郎"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full" disabled={!groupName.trim() || !userName.trim()}>
                  <Users className="h-4 w-4 mr-2" />
                  グループを作成
                </Button>
              </TabsContent>

              <TabsContent value="join" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">招待コード</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userNameJoin">あなたの名前</Label>
                  <Input
                    id="userNameJoin"
                    placeholder="田中花子"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <Button onClick={handleJoinGroup} className="w-full" disabled={!inviteCode.trim() || !userName.trim()}>
                  <Key className="h-4 w-4 mr-2" />
                  グループに参加
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
