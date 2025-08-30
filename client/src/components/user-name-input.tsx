"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

interface UserNameInputProps {
  onUserNameSet: (userName: string) => void
  initialValue?: string
}

export default function UserNameInput({ onUserNameSet, initialValue }: UserNameInputProps) {
  // 制御文字と改行を除去（絵文字・記号は許可）
  const sanitize = (v: string) => v.replace(/[\p{C}\r\n]+/gu, "")
  const [userName, setUserName] = useState(initialValue ? sanitize(initialValue) : "")
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const sanitized = sanitize(raw)
    setUserName(sanitized)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = userName.trim()
    if (!trimmed) {
      setError("名前を入力してください")
      return
    }
    onUserNameSet(trimmed)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>あなたの名前を入力してください</CardTitle>
        <CardDescription>食事申し込み表に表示される名前です</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="例: 田中太郎"
              value={userName}
              onChange={handleChange}
              className="text-center"
              autoFocus
              aria-invalid={!!error}
            />
            {error && (
              <p className="text-destructive text-sm mt-2" role="alert">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!userName.trim()}>
            次へ
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
