"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MonthNavigator from "@/components/month-navigator"
import { Sun, Utensils, Moon, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { saveMealSignupApi } from "@/api/meals"
import { fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup } from "@/api/mealSignup"

type MealStatus = "applied" | "not-applied"

interface GroupData {
  id: string
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
  const { getToken } = useAuth()
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [mealData, setMealData] = useState<Record<number, { breakfast: boolean; lunch: boolean; dinner: boolean }>>({})
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const fetchMealData = async () => {
    const token = await getToken()
    if (!token) return
    try {
      const data = await fetchSelfMonthlyMealSignup(currentYear, currentMonth, token, groupData?.id ?? '')
      const formattedData = data.reduce((acc: Record<number, { breakfast: boolean; lunch: boolean; dinner: boolean }>, item: { day: number; breakfast: boolean; lunch: boolean; dinner: boolean }) => {
        acc[item.day] = { breakfast: item.breakfast, lunch: item.lunch, dinner: item.dinner }
        return acc
      }, {})
      setMealData(formattedData)
    } catch (error) {
      console.error("Failed to fetch meal data:", error)
    }
  }

  useEffect(() => {
    if (groupData) {
      fetchMealData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth, groupData])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)


  const toggleMealStatus = async (day: number, mealType: "breakfast" | "lunch" | "dinner") => {
    const token = await getToken();
    if (!token || !groupData) return;

    const currentDayData = mealData[day] || { breakfast: false, lunch: false, dinner: false };
    const newStatus = !currentDayData[mealType];

    const updatedDayData = {
      ...currentDayData,
      [mealType]: newStatus,
    };

    // UIを即時反映 (楽観的更新)
    setMealData(prevData => ({ ...prevData, [day]: updatedDayData }));

    try {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      await saveMealSignupApi(dateStr, updatedDayData, groupData.id, token);
    } catch (error) {
      console.error("Failed to update meal status:", error);
      // エラー発生時はUIを元の状態に戻す
      setMealData(prevData => ({
        ...prevData,
        [day]: currentDayData
      }));
    }
  }

  const handleBulkUpdate = async (apply: boolean) => {
    const token = await getToken();
    if (!token || !groupData) return;

    const originalMealData = { ...mealData };
    setIsBulkUpdating(true);

    const daysInMonthValue = getDaysInMonth(currentYear, currentMonth);
    const newMealData: typeof mealData = {};
    const monthlySignupPayload = [];
    for (let day = 1; day <= daysInMonthValue; day++) {
        newMealData[day] = { breakfast: apply, lunch: apply, dinner: apply };
        monthlySignupPayload.push({ day, breakfast: apply, lunch: apply, dinner: apply });
    }
    setMealData(newMealData);

    try {
        await saveSelfMonthlyMealSignup(monthlySignupPayload, currentYear, currentMonth, groupData.id, token);
    } catch (error) {
        console.error(`Failed to ${apply ? 'apply' : 'cancel'} all meals:`, error);
        // エラー発生時はUIを元の状態に戻す
        setMealData(originalMealData);
    } finally {
        setIsBulkUpdating(false);
    }
  };

  const applyAllMeals = () => handleBulkUpdate(true);
  const cancelAllMeals = () => handleBulkUpdate(false);

  const navigateToStatistics = () => {
    console.log("[v0] 統計画面に移動")
    // 実際のアプリケーションでは、ここでルーティングを行う
    onNavigateToSummary()
  }

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
            <MonthNavigator
              year={currentYear}
              month={currentMonth}
              onChange={(y, m) => {
                setCurrentYear(y);
                setCurrentMonth(m);
              }}
            />
            <div className="flex flex-row gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={applyAllMeals}
                className="bg-chart-1 hover:bg-chart-1/90 text-white w-20 px-4 flex-shrink-0"
                disabled={isBulkUpdating}
              >
                全申込
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelAllMeals}
                className="border-destructive text-destructive hover:bg-destructive hover:text-white bg-transparent w-20 px-4 flex-shrink-0"
                disabled={isBulkUpdating}
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
                  const dayBooleans = mealData[day] || {
                    breakfast: false,
                    lunch: false,
                    dinner: false,
                  }
                  const dayApplications = {
                    breakfast: (dayBooleans.breakfast ? "applied" : "not-applied") as MealStatus,
                    lunch: (dayBooleans.lunch ? "applied" : "not-applied") as MealStatus,
                    dinner: (dayBooleans.dinner ? "applied" : "not-applied") as MealStatus,
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
