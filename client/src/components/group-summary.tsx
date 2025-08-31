"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft } from "lucide-react"
import MonthNavigator from "@/components/month-navigator"
import { fetchMonthlySummary } from "@/api/monthlySummary"
import type { DailyData } from "../types/DailyData"

interface GroupSummaryProps {
  onBack: () => void
  groupData?: {
    id: string
    name: string
    userName: string
    inviteCode: string
  } | null
}

export default function GroupSummary({ onBack, groupData }: GroupSummaryProps) {
  const { getToken } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dailySummary, setDailySummary] = useState<Record<string, DailyData>>({})
  const [isLoading, setIsLoading] = useState(true)

  const displayGroupName = groupData?.name
  const displayInviteCode = groupData?.inviteCode

  useEffect(() => {
    const loadSummary = async () => {
      if (!groupData) return
      setIsLoading(true)
      try {
        const summaryResponse = await fetchMonthlySummary({ id: groupData.id }, currentDate, getToken)
        const summaryMap = summaryResponse.dailyData.reduce(
          (acc, item) => {
            acc[item.day] = item
            return acc
          },
          {} as Record<string, DailyData>
        )
        setDailySummary(summaryMap)
      } catch (error) {
        console.error("Failed to fetch monthly summary:", error)
        setDailySummary({})
      } finally {
        setIsLoading(false)
      }
    }
    loadSummary()
  }, [currentDate, groupData, getToken])



  return (
    <div className="space-y-6">
        {/* グループ情報 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-lg">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-foreground">
                グループ名: {displayGroupName || "N/A"}
              </span>
              <Badge variant="outline" className="text-sm px-3 py-1">
                招待コード: {displayInviteCode || "N/A"}
              </Badge>
            </div>
          </div>
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold text-primary">グループサマリー</h1>
          <div></div>
        </div>

        {/* 月選択 */}
        <Card>
          <CardHeader className="pb-4">
            <MonthNavigator
              year={currentDate.getFullYear()}
              month={currentDate.getMonth() + 1}
              onChange={(y, m) => setCurrentDate(new Date(y, m - 1, 1))}
              className="justify-center"
            />
          </CardHeader>
        </Card>

        {/* 日別サマリーテーブル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">日別申込数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">日付</th>
                    <th className="text-center p-2 font-medium">朝食</th>
                    <th className="text-center p-2 font-medium">昼食</th>
                    <th className="text-center p-2 font-medium">夕食</th>
                    <th className="text-center p-2 font-medium">合計</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4">
                        読み込み中...
                      </td>
                    </tr>
                  ) : Object.keys(dailySummary).length > 0 ? (
                    Object.entries(dailySummary).map(([day, meals]) => (
                      <tr key={day} className="border-b hover:bg-muted/50">
                        <td className="p-2">{day}日</td>
                        <td className="text-center p-2">
                          <Badge variant={meals.breakfast > 0 ? "default" : "secondary"}>{meals.breakfast}</Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={meals.lunch > 0 ? "default" : "secondary"}>{meals.lunch}</Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={meals.dinner > 0 ? "default" : "secondary"}>{meals.dinner}</Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant="outline" className="font-semibold">
                            {meals.breakfast + meals.lunch + meals.dinner}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center p-4">
                        表示するデータがありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
