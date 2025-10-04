"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Utensils, Moon, Check, X, Package } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/clerk-react"
import { saveMealSignupApi } from "@/api/meals"
import { fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup, type MealOrderTypeId, type MonthlyMealSignupItem } from "@/api/mealSignup"
import { isJapaneseHoliday } from "@/lib/holidays"
import type { GroupData } from "@/types/GroupData"

type MealType = "breakfast" | "lunch" | "dinner"

interface DayMealStatus {
  breakfast: MealOrderTypeId
  lunch: MealOrderTypeId
  dinner: MealOrderTypeId
}

const getMealStatusIcon = (status: MealOrderTypeId) => {
  switch (status) {
    case "NORMAL":
      return <Check className="h-3 w-3 text-chart-1" />
    case "TAKEOUT":
      return <Package className="h-3 w-3 text-amber-500" />
    case "NONE":
    default:
      return <X className="h-3 w-3 text-muted-foreground" />
  }
}

const getMealStatusBadge = (status: MealOrderTypeId) => {
  switch (status) {
    case "NORMAL":
      return (
        <Badge variant="default" className="bg-chart-1 text-white text-xs px-1 py-0">
          申込
        </Badge>
      )
    case "TAKEOUT":
      return (
        <Badge variant="default" className="bg-amber-500 text-white text-xs px-1 py-0">
          弁当
        </Badge>
      )
    case "NONE":
    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground text-xs px-1 py-0">
          未申込
        </Badge>
      )
  }
}

const getNextStatus = (current: MealOrderTypeId): MealOrderTypeId => {
  switch (current) {
    case "NONE":
      return "NORMAL"
    case "NORMAL":
      return "TAKEOUT"
    case "TAKEOUT":
    default:
      return "NONE"
  }
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate()
}

interface MealApplicationTableProps {
  groupData?: GroupData | null
  year: number
  month: number
}

export function MealApplicationTable({
  groupData,
  year,
  month
}: MealApplicationTableProps) {
  const { getToken } = useAuth()
  const [mealData, setMealData] = useState<Record<number, DayMealStatus>>({})
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const fetchMealData = useCallback(async () => {
    if (!groupData?.id) {
      setMealData({})
      return
    }
    try {
      const data = await fetchSelfMonthlyMealSignup(year, month, getToken, groupData.id)
      const formattedData = data.reduce((acc: Record<number, DayMealStatus>, item: MonthlyMealSignupItem) => {
        acc[item.day] = {
          breakfast: item.breakfast,
          lunch: item.lunch,
          dinner: item.dinner
        }
        return acc
      }, {})
      setMealData(formattedData)
    } catch (error) {
      console.error("Failed to fetch meal data:", error)
      setMealData({})
    }
  }, [year, month, groupData?.id, getToken])

  useEffect(() => {
    fetchMealData()
  }, [fetchMealData])

  const daysInMonth = getDaysInMonth(year, month)
  const today = new Date()

  const toggleMealStatus = async (day: number, mealType: MealType) => {
    if (!groupData) return

    const currentDayData: DayMealStatus = mealData[day] || {
      breakfast: "NONE",
      lunch: "NONE",
      dinner: "NONE"
    }
    const nextStatus = getNextStatus(currentDayData[mealType])

    const updatedDayData: DayMealStatus = {
      ...currentDayData,
      [mealType]: nextStatus
    }

    setMealData(prevData => ({ ...prevData, [day]: updatedDayData }))

    try {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      await saveMealSignupApi(dateStr, updatedDayData, groupData.id, getToken)
    } catch (error) {
      console.error("Failed to update meal status:", error)
      setMealData(prevData => ({
        ...prevData,
        [day]: currentDayData
      }))
    }
  }

  const handleBulkUpdate = async (targetStatus: MealOrderTypeId) => {
    if (!groupData) return

    const originalMealData = { ...mealData }
    setIsBulkUpdating(true)

    const daysInMonthValue = getDaysInMonth(year, month)
    const newMealData: typeof mealData = {}
    const monthlySignupPayload: MonthlyMealSignupItem[] = []

    for (let day = 1; day <= daysInMonthValue; day++) {
      newMealData[day] = { breakfast: targetStatus, lunch: targetStatus, dinner: targetStatus }
      monthlySignupPayload.push({
        day,
        breakfast: targetStatus,
        lunch: targetStatus,
        dinner: targetStatus
      })
    }
    setMealData(newMealData)

    try {
      await saveSelfMonthlyMealSignup(monthlySignupPayload, year, month, groupData.id, getToken)
    } catch (error) {
      console.error(`Failed to set meals to ${targetStatus}:`, error)
      setMealData(originalMealData)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const applyAllMeals = () => handleBulkUpdate("NORMAL")
  const cancelAllMeals = () => handleBulkUpdate("NONE")

  return (
    <Card>
      <CardHeader className="px-2 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={applyAllMeals}
            className="bg-chart-1 hover:bg-chart-1/90 text-white w-full sm:w-auto px-4 flex-shrink-0"
            disabled={isBulkUpdating}
          >
            全申込
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={cancelAllMeals}
            className="border-destructive text-destructive hover:bg-destructive hover:text-white bg-transparent w-full sm:w-auto px-4 flex-shrink-0"
            disabled={isBulkUpdating}
          >
            全解除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] sm:text-sm leading-tight">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-semibold text-foreground min-w-0 sm:min-w-[80px]">日付</th>
                <th className="text-center p-1 sm:p-3 md:p-4 font-semibold text-foreground min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                    <span className="text-[11px] sm:text-sm">朝食</span>
                  </div>
                </th>
                <th className="text-center p-1 sm:p-3 md:p-4 font-semibold text-foreground min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Utensils className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                    <span className="text-[11px] sm:text-sm">昼食</span>
                  </div>
                </th>
                <th className="text-center p-1 sm:p-3 md:p-4 font-semibold text-foreground min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
                    <span className="text-[11px] sm:text-sm">夕食</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateObj = new Date(year, month - 1, day)
                const weekday = dateObj.getDay()
                const isHoliday = isJapaneseHoliday(dateObj)
                const isSunday = weekday === 0
                const isSaturday = weekday === 6
                const isHolidayOrSunday = isHoliday || isSunday
                const dayNumberClass = isHolidayOrSunday ? "text-red-600" : isSaturday ? "text-blue-600" : ""
                const weekdayLabelClass = isHolidayOrSunday ? "text-red-600" : isSaturday ? "text-blue-600" : "text-muted-foreground"
                const isToday =
                  dateObj.getFullYear() === today.getFullYear() &&
                  dateObj.getMonth() === today.getMonth() &&
                  dateObj.getDate() === today.getDate()

                const dayData = mealData[day] || { breakfast: "NONE", lunch: "NONE", dinner: "NONE" }

                return (
                  <tr key={day} className={`border-b ${isToday ? "bg-accent/10" : ""}`}>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-base sm:text-lg ${dayNumberClass}`}>{day}日</span>
                        <span className={`text-[11px] sm:text-sm ${weekdayLabelClass}`}>
                          (
                          {dateObj.toLocaleDateString("ja-JP", { weekday: "short" })}
                          )
                        </span>
                      </div>
                    </td>
                    <td className="text-center p-1 sm:p-3 md:p-4">
                      <button
                        onClick={() => toggleMealStatus(day, "breakfast")}
                        className="flex items-center justify-center gap-1 sm:gap-2 w-full"
                        aria-pressed={dayData.breakfast !== "NONE"}
                      >
                        {getMealStatusIcon(dayData.breakfast)}
                        <span className="inline-block">
                          {getMealStatusBadge(dayData.breakfast)}
                        </span>
                      </button>
                    </td>
                    <td className="text-center p-1 sm:p-3 md:p-4">
                      <button
                        onClick={() => toggleMealStatus(day, "lunch")}
                        className="flex items-center justify-center gap-1 sm:gap-2 w-full"
                        aria-pressed={dayData.lunch !== "NONE"}
                      >
                        {getMealStatusIcon(dayData.lunch)}
                        <span className="inline-block">
                          {getMealStatusBadge(dayData.lunch)}
                        </span>
                      </button>
                    </td>
                    <td className="text-center p-1 sm:p-3 md:p-4">
                      <button
                        onClick={() => toggleMealStatus(day, "dinner")}
                        className="flex items-center justify-center gap-1 sm:gap-2 w-full"
                        aria-pressed={dayData.dinner !== "NONE"}
                      >
                        {getMealStatusIcon(dayData.dinner)}
                        <span className="inline-block">
                          {getMealStatusBadge(dayData.dinner)}
                        </span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
