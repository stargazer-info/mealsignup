"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Utensils, Moon, Check, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { useState } from "react"

// サンプルデータ
const sampleData = {
  groups: [
    {
      id: 1,
      userName: "田中 太郎",
      groupName: "田中ファミリー",
      inviteCode: "ABC123",
      applications: {
        "2025-8": {
          1: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          2: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          3: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          4: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          5: { breakfast: "applied", lunch: "applied", dinner: "applied" },
        },
        "2025-9": {
          1: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          2: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          3: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          4: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
        },
        "2025-7": {
          1: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          2: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          3: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          4: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
        },
      },
    },
    {
      id: 2,
      userName: "佐藤 花子",
      groupName: "佐藤ファミリー",
      inviteCode: "XYZ789",
      applications: {
        "2025-8": {
          1: { breakfast: "not-applied", lunch: "applied", dinner: "not-applied" },
          2: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          3: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          4: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
        },
        "2025-9": {
          1: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          2: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          3: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          4: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
        },
        "2025-7": {
          1: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          2: { breakfast: "not-applied", lunch: "not-applied", dinner: "applied" },
          3: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          4: { breakfast: "not-applied", lunch: "applied", dinner: "not-applied" },
          5: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
        },
      },
    },
    {
      id: 3,
      userName: "山田 次郎",
      groupName: "山田ファミリー",
      inviteCode: "DEF456",
      applications: {
        "2025-8": {
          1: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          2: { breakfast: "not-applied", lunch: "applied", dinner: "not-applied" },
          3: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          4: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          5: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
        },
        "2025-9": {
          1: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          2: { breakfast: "applied", lunch: "not-applied", dinner: "applied" },
          3: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          4: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
        },
        "2025-7": {
          1: { breakfast: "not-applied", lunch: "applied", dinner: "applied" },
          2: { breakfast: "applied", lunch: "applied", dinner: "not-applied" },
          3: { breakfast: "not-applied", lunch: "not-applied", dinner: "applied" },
          4: { breakfast: "applied", lunch: "applied", dinner: "applied" },
          5: { breakfast: "applied", lunch: "not-applied", dinner: "not-applied" },
        },
      },
    },
  ],
}

type MealStatus = "applied" | "not-applied"

interface MealApplications {
  breakfast: MealStatus
  lunch: MealStatus
  dinner: MealStatus
}

interface GroupData {
  name: string
  userName: string
  inviteCode: string
}

const getMealIcon = (mealType: "breakfast" | "lunch" | "dinner") => {
  switch (mealType) {
    case "breakfast":
      return <Sun className="h-4 w-4" />
    case "lunch":
      return <Utensils className="h-4 w-4" />
    case "dinner":
      return <Moon className="h-4 w-4" />
  }
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
  const [currentGroupId, setCurrentGroupId] = useState(1)
  const [mealData, setMealData] = useState(sampleData)

  const currentGroup = mealData.groups.find((group) => group.id === currentGroupId) || mealData.groups[0]

  const displayUserName = groupData?.userName || currentGroup.userName
  const displayGroupName = groupData?.name || currentGroup.groupName
  const displayInviteCode = groupData?.inviteCode || currentGroup.inviteCode

  const { applications } = currentGroup
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

  const toggleMealStatus = (day: number, mealType: "breakfast" | "lunch" | "dinner") => {
    const monthKey = `${currentYear}-${currentMonth}`

    setMealData((prevData) => {
      const updatedData = { ...prevData }
      const groupIndex = updatedData.groups.findIndex((group) => group.id === currentGroupId)

      if (groupIndex === -1) return prevData

      const updatedGroup = { ...updatedData.groups[groupIndex] }
      const updatedApplications = { ...updatedGroup.applications }

      if (!updatedApplications[monthKey]) {
        updatedApplications[monthKey] = {}
      }

      const currentDayData = updatedApplications[monthKey][day] || {
        breakfast: "not-applied" as MealStatus,
        lunch: "not-applied" as MealStatus,
        dinner: "not-applied" as MealStatus,
      }

      const newStatus: MealStatus = currentDayData[mealType] === "applied" ? "not-applied" : "applied"

      updatedApplications[monthKey] = {
        ...updatedApplications[monthKey],
        [day]: {
          ...currentDayData,
          [mealType]: newStatus,
        },
      }

      updatedGroup.applications = updatedApplications
      updatedData.groups[groupIndex] = updatedGroup

      console.log(`[v0] ${day}日の${mealType}を${newStatus}に変更`)
      return updatedData
    })
  }

  const applyAllMeals = () => {
    const monthKey = `${currentYear}-${currentMonth}`

    setMealData((prevData) => {
      const updatedData = { ...prevData }
      const groupIndex = updatedData.groups.findIndex((group) => group.id === currentGroupId)

      if (groupIndex === -1) return prevData

      const updatedGroup = { ...updatedData.groups[groupIndex] }
      const updatedApplications = { ...updatedGroup.applications }

      if (!updatedApplications[monthKey]) {
        updatedApplications[monthKey] = {}
      }

      for (let day = 1; day <= daysInMonth; day++) {
        updatedApplications[monthKey][day] = {
          breakfast: "applied" as MealStatus,
          lunch: "applied" as MealStatus,
          dinner: "applied" as MealStatus,
        }
      }

      updatedGroup.applications = updatedApplications
      updatedData.groups[groupIndex] = updatedGroup

      console.log("[v0] 全て申し込み完了")
      return updatedData
    })
  }

  const cancelAllMeals = () => {
    const monthKey = `${currentYear}-${currentMonth}`

    setMealData((prevData) => {
      const updatedData = { ...prevData }
      const groupIndex = updatedData.groups.findIndex((group) => group.id === currentGroupId)

      if (groupIndex === -1) return prevData

      const updatedGroup = { ...updatedData.groups[groupIndex] }
      const updatedApplications = { ...updatedGroup.applications }

      if (!updatedApplications[monthKey]) {
        updatedApplications[monthKey] = {}
      }

      for (let day = 1; day <= daysInMonth; day++) {
        updatedApplications[monthKey][day] = {
          breakfast: "not-applied" as MealStatus,
          lunch: "not-applied" as MealStatus,
          dinner: "not-applied" as MealStatus,
        }
      }

      updatedGroup.applications = updatedApplications
      updatedData.groups[groupIndex] = updatedGroup

      console.log("[v0] 全て申し込み取消完了")
      return updatedData
    })
  }

  const navigateToStatistics = () => {
    console.log("[v0] 統計画面に移動")
    // 実際のアプリケーションでは、ここでルーティングを行う
    onNavigateToSummary()
  }

  const currentApplications = applications[`${currentYear}-${currentMonth}`] || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">グループ名: </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-semibold text-foreground hover:bg-muted p-2 h-auto">
                    {displayGroupName}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  {sampleData.groups.map((group) => (
                    <DropdownMenuItem
                      key={group.id}
                      onClick={() => setCurrentGroupId(group.id)}
                      className={currentGroupId === group.id ? "bg-muted" : ""}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{group.groupName}</span>
                        <span className="text-xs text-muted-foreground">{group.userName}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              招待コード: {displayInviteCode}
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
