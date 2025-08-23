"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

type MealStatus = "applied" | "not_applied"

interface MealData {
  breakfast: MealStatus
  lunch: MealStatus
  dinner: MealStatus
}

interface GroupData {
  groupName: string
  inviteCode: string
  members: {
    name: string
    meals: Record<string, MealData>
  }[]
}

// サンプルデータ
const groupsData: GroupData[] = [
  {
    groupName: "田中ファミリー",
    inviteCode: "ABC123",
    members: [
      {
        name: "田中太郎",
        meals: {
          "2025-08": {
            "1": { breakfast: "applied", lunch: "applied", dinner: "not_applied" },
            "2": { breakfast: "not_applied", lunch: "applied", dinner: "applied" },
            "3": { breakfast: "applied", lunch: "not_applied", dinner: "applied" },
            // ... 他の日付
          },
        },
      },
      {
        name: "田中花子",
        meals: {
          "2025-08": {
            "1": { breakfast: "applied", lunch: "not_applied", dinner: "applied" },
            "2": { breakfast: "applied", lunch: "applied", dinner: "not_applied" },
            "3": { breakfast: "not_applied", lunch: "applied", dinner: "applied" },
            // ... 他の日付
          },
        },
      },
    ],
  },
  {
    groupName: "佐藤ファミリー",
    inviteCode: "DEF456",
    members: [
      {
        name: "佐藤一郎",
        meals: {
          "2025-08": {
            "1": { breakfast: "applied", lunch: "applied", dinner: "applied" },
            "2": { breakfast: "applied", lunch: "not_applied", dinner: "applied" },
            "3": { breakfast: "not_applied", lunch: "applied", dinner: "not_applied" },
          },
        },
      },
      {
        name: "佐藤美咲",
        meals: {
          "2025-08": {
            "1": { breakfast: "not_applied", lunch: "applied", dinner: "applied" },
            "2": { breakfast: "applied", lunch: "applied", dinner: "applied" },
            "3": { breakfast: "applied", lunch: "not_applied", dinner: "applied" },
          },
        },
      },
    ],
  },
]

interface GroupSummaryProps {
  onBack: () => void
  groupData?: {
    name: string
    userName: string
    inviteCode: string
  } | null
}

export default function GroupSummary({ onBack, groupData }: GroupSummaryProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7)) // 2025年8月

  const currentGroup = groupsData[0]

  const displayGroupName = groupData?.name || currentGroup.groupName
  const displayInviteCode = groupData?.inviteCode || currentGroup.inviteCode

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`

  // 日付ごとの合計食事数を計算
  const calculateDailySummary = () => {
    const summary: Record<string, { breakfast: number; lunch: number; dinner: number }> = {}

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      summary[day.toString()] = { breakfast: 0, lunch: 0, dinner: 0 }
    }

    currentGroup.members.forEach((member) => {
      const monthData = member.meals[monthKey]
      if (monthData) {
        Object.entries(monthData).forEach(([day, meals]) => {
          if (meals.breakfast === "applied") summary[day].breakfast++
          if (meals.lunch === "applied") summary[day].lunch++
          if (meals.dinner === "applied") summary[day].dinner++
        })
      }
    })

    return summary
  }

  const dailySummary = calculateDailySummary()

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }


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
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-primary">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
                  {Object.entries(dailySummary).map(([day, meals]) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
