"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Utensils, Moon, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

type MealStatus = "applied" | "not-applied"

interface GroupData {
  name: string
  userName: string
  inviteCode: string
}

const getMealStatusIcon = (status: MealStatus) => {
  switch (status) {
    case "applied":
      return <Check className="h-3 w-3 text-chart-1" />
    case "not-applied":
      return <X className="h-3 w-3 text-destructive" />
  }
}

const getMealStatusBadge = (status: MealStatus) => {
  switch (status) {
    case "applied":
      return (
        <Badge variant="default" className="bg-chart-1 text-white text-xs px-1 py-0">
          申込済
        </Badge>
      )
    case "not-applied":
      return (
        <Badge variant="destructive" className="text-xs px-1 py-0">
          未申込
        </Badge>
      )
  }
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate()
}

interface MealApplicationTableProps {
  onNavigateToSummary: () => void
  groupData?: GroupData | null
}

export function MealApplicationTable({ onNavigateToSummary, groupData }: MealApplicationTableProps) {
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(8)
  // TODO: APIから取得した食事データで初期化する
  const [mealData, setMealData] = useState<Record<string, any>>({})

  const applications = mealData[`${currentYear}-${currentMonth}`] || {}
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  // TODO: APIを呼び出して食事の申し込み状態を更新する
  const toggleMealStatus = (day: number, mealType: "breakfast" | "lunch" | "dinner") => {
    console.log(`[v0] ${day}日の${mealType}を切り替え`)
  }

  // TODO: APIを呼び出して一括申し込み
  const applyAllMeals = () => {
    console.log("[v0] 全て申し込み完了")
  }

  // TODO: APIを呼び出して一括解除
  const cancelAllMeals = () => {
    console.log("[v0] 全て申し込み取消完了")
  }

  const navigateToStatistics = () => {
    console.log("[v0] 統計画面に移動")
    // 実際のアプリケーションでは、ここでルーティングを行う
    onNavigateToSummary()
  }

  const currentApplications = applications || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-lg">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-foreground">
              グループ名: {groupData?.name || "N/A"}
            </span>
            <Badge variant="outline" className="text-sm px-3 py-1">
              招待コード: {groupData?.inviteCode || "N/A"}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="p-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold text-primary">
                {currentYear}年 {currentMonth}月
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="p-2">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-row gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={applyAllMeals}
                className="bg-chart-1 hover:bg-chart-1/90 text-white w-20 px-4 flex-shrink-0"
              >
                全申込
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelAllMeals}
                className="border-destructive text-destructive hover:bg-destructive hover:text-white bg-transparent w-20 px-4 flex-shrink-0"
              >
                全解除
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={navigateToStatistics}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-3 flex-shrink-0"
              >
                グループサマリー
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground min-w-[80px]">日付</th>
                  <th className="text-center p-4 font-semibold text-foreground min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      朝食
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-foreground min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Utensils className="h-4 w-4 text-orange-500" />
                      昼食
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold text-foreground min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Moon className="h-4 w-4 text-blue-500" />
                      夕食
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const dayApplications = currentApplications[day as keyof typeof currentApplications] || {
                    breakfast: "not-applied" as MealStatus,
                    lunch: "not-applied" as MealStatus,
                    dinner: "not-applied" as MealStatus,
                  }

                  return (
                    <tr key={day} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{day}日</span>
                          <span className="text-sm text-muted-foreground">
                            (
                            {new Date(currentYear, currentMonth - 1, day).toLocaleDateString("ja-JP", {
                              weekday: "short",
                            })}
                            )
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                          onClick={() => toggleMealStatus(day, "breakfast")}
                        >
                          {getMealStatusIcon(dayApplications.breakfast)}
                          {getMealStatusBadge(dayApplications.breakfast)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                          onClick={() => toggleMealStatus(day, "lunch")}
                        >
                          {getMealStatusIcon(dayApplications.lunch)}
                          {getMealStatusBadge(dayApplications.lunch)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                          onClick={() => toggleMealStatus(day, "dinner")}
                        >
                          {getMealStatusIcon(dayApplications.dinner)}
                          {getMealStatusBadge(dayApplications.dinner)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
