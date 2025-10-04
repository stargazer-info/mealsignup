"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchMonthlySummary } from "@/api/monthlySummary"
import type { DailyData, MealTypeData } from "../types/DailyData"
import type { GroupData } from "@/types/GroupData"
import { isJapaneseHoliday } from "@/lib/holidays"

interface GroupSummaryProps {
  groupData?: GroupData | null
  year: number
  month: number
}

type MealType = "breakfast" | "lunch" | "dinner"
type OrderVariant = "normal" | "takeout"

export default function GroupSummary({
  groupData,
  year,
  month
}: GroupSummaryProps) {
  const { getToken } = useAuth()
  const [dailySummary, setDailySummary] = useState<Record<string, DailyData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hoverCell, setHoverCell] = useState<{ day: number; meal: MealType; orderType: OrderVariant } | null>(null)

  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const loadSummary = useCallback(async () => {
    if (!groupData) return
    setIsLoading(true)
    try {
      const currentDate = new Date(year, month - 1, 1)
      const summaryResponse = await fetchMonthlySummary({ id: groupData.id }, currentDate, getTokenRef.current)
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
  }, [year, month, groupData?.id])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const renderUserChips = (users: string[]) => {
    if (!users || users.length === 0) {
      return <span className="text-xs text-muted-foreground">申込者なし</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {users.map((name, index) => (
          <span key={`${name}-${index}`} className="bg-muted rounded px-2 py-0.5 text-xs break-words">
            {name}
          </span>
        ))}
      </div>
    )
  }

  const renderMealCell = (day: number, mealType: MealType, mealData: MealTypeData) => {
    const normalCount = mealData.normal.count
    const takeoutCount = mealData.takeout.count
    const normalUsers = mealData.normal.users ?? []
    const takeoutUsers = mealData.takeout.users ?? []

    const isHovered = hoverCell?.day === day && hoverCell.meal === mealType
    const isNormalHovered = isHovered && hoverCell?.orderType === "normal"
    const isTakeoutHovered = isHovered && hoverCell?.orderType === "takeout"

    const handleMouseEnter = (orderType: OrderVariant, count: number) => {
      if (count > 0) setHoverCell({ day, meal: mealType, orderType })
    }

    const handleMouseLeave = (orderType: OrderVariant) => {
      setHoverCell(prev =>
        prev && prev.day === day && prev.meal === mealType && prev.orderType === orderType
          ? null
          : prev
      )
    }

    const handleClick = (orderType: OrderVariant, count: number) => {
      if (count === 0) return
      setHoverCell(prev =>
        prev &&
        prev.day === day &&
        prev.meal === mealType &&
        prev.orderType === orderType
          ? null
          : { day, meal: mealType, orderType }
      )
    }

    return (
      <td className={`relative text-center p-2 ${isHovered ? "bg-accent/20" : ""}`}>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            className={`relative ${normalCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            onMouseEnter={() => handleMouseEnter("normal", normalCount)}
            onMouseLeave={() => handleMouseLeave("normal")}
            onClick={() => handleClick("normal", normalCount)}
          >
            <Badge
              variant={normalCount > 0 ? "default" : "secondary"}
              className="text-xs px-2 py-0 flex items-center gap-1"
            >
              通常 <span className="font-semibold">{normalCount}</span>
            </Badge>
          </button>
          {isNormalHovered && normalCount > 0 && (
            <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 shadow-lg max-h-60 overflow-auto min-w-max max-w-xs text-left">
              {renderUserChips(normalUsers)}
            </div>
          )}
          {takeoutCount > 0 && (
            <>
              <button
                type="button"
                className="relative cursor-pointer"
                onMouseEnter={() => handleMouseEnter("takeout", takeoutCount)}
                onMouseLeave={() => handleMouseLeave("takeout")}
                onClick={() => handleClick("takeout", takeoutCount)}
              >
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0 flex items-center gap-1 border-amber-500 text-amber-600 bg-amber-50"
                >
                  弁当 <span className="font-semibold">{takeoutCount}</span>
                </Badge>
              </button>
              {isTakeoutHovered && (
                <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 shadow-lg max-h-60 overflow-auto min-w-max max-w-xs text-left">
                  {renderUserChips(takeoutUsers)}
                </div>
              )}
            </>
          )}
        </div>
      </td>
    )
  }

  const today = new Date()

  if (!groupData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          グループ情報が見つかりません。
        </CardContent>
      </Card>
    )
  }

  const dailyEntries = Object.entries(dailySummary).sort(
    ([dayA], [dayB]) => Number(dayA) - Number(dayB)
  )

  return (
    <Card>
      <CardHeader className="px-2 sm:px-6">
        <CardTitle className="text-primary">日別申込数</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 sm:p-4 font-medium">日付</th>
                <th className="text-center p-2 sm:p-4 font-medium">朝食</th>
                <th className="text-center p-2 sm:p-4 font-medium">昼食</th>
                <th className="text-center p-2 sm:p-4 font-medium">夕食</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    読み込み中...
                  </td>
                </tr>
              ) : dailyEntries.length > 0 ? (
                dailyEntries.map(([day, meals]) => {
                  const numericDay = Number(day)
                  const dateObj = new Date(year, month - 1, numericDay)
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
                      {renderMealCell(numericDay, "breakfast", meals.breakfast)}
                      {renderMealCell(numericDay, "lunch", meals.lunch)}
                      {renderMealCell(numericDay, "dinner", meals.dinner)}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    表示するデータがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
