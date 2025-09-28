"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchMonthlySummary } from "@/api/monthlySummary"
import type { DailyData } from "../types/DailyData"
import type { GroupData } from "@/types/GroupData"
import { isJapaneseHoliday } from "@/lib/holidays"

interface GroupSummaryProps {
  groupData?: GroupData | null
  year: number
  month: number
}

export default function GroupSummary({
  groupData,
  year,
  month
}: GroupSummaryProps) {
  const { getToken } = useAuth()
  const [dailySummary, setDailySummary] = useState<Record<string, DailyData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hoverCell, setHoverCell] = useState<{ day: number; meal: "breakfast" | "lunch" | "dinner" } | null>(null)

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
                <th className="text-center p-2 sm:p-4 font-medium">合計</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
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
                    <tr
                      key={day}
                      className={`border-b ${isToday ? "bg-accent/10" : ""}`}
                    >
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
                      <td
                        className={`relative text-center p-2 ${hoverCell?.day === numericDay && hoverCell.meal === "breakfast" ? "bg-accent/20" : ""} ${meals.breakfast.count > 0 ? "cursor-pointer" : "cursor-default"}`}
                        onMouseEnter={() => {
                          if (meals.breakfast.count > 0) setHoverCell({ day: numericDay, meal: "breakfast" })
                        }}
                        onMouseLeave={() => setHoverCell(null)}
                        onClick={() => {
                          if (meals.breakfast.count === 0) return
                          setHoverCell(prev =>
                            prev && prev.day === numericDay && prev.meal === "breakfast"
                              ? null
                              : { day: numericDay, meal: "breakfast" }
                          )
                        }}
                      >
                        <Badge variant={meals.breakfast.count > 0 ? "default" : "secondary"}>{meals.breakfast.count}</Badge>
                        {hoverCell?.day === numericDay && hoverCell.meal === "breakfast" && meals.breakfast.count > 0 && (
                          <div className="absolute z-50 bottom-full mb-1 right-0 bg-popover border rounded-md p-2 shadow-lg max-h-60 overflow-auto min-w-max max-w-xs text-left">
                            {(meals.breakfast.users?.length ?? 0) > 0
                              ? <div className="flex flex-wrap gap-1">
                                  {meals.breakfast.users.map((name, i) => (
                                    <span key={`${name}-${i}`} className="bg-muted rounded px-2 py-0.5 text-xs break-words">{name}</span>
                                  ))}
                                </div>
                              : <span className="text-xs text-muted-foreground">申込者なし</span>}
                          </div>
                        )}
                      </td>
                      <td
                        className={`relative text-center p-2 ${hoverCell?.day === numericDay && hoverCell.meal === "lunch" ? "bg-accent/20" : ""} ${meals.lunch.count > 0 ? "cursor-pointer" : "cursor-default"}`}
                        onMouseEnter={() => {
                          if (meals.lunch.count > 0) setHoverCell({ day: numericDay, meal: "lunch" })
                        }}
                        onMouseLeave={() => setHoverCell(null)}
                        onClick={() => {
                          if (meals.lunch.count === 0) return
                          setHoverCell(prev =>
                            prev && prev.day === numericDay && prev.meal === "lunch"
                              ? null
                              : { day: numericDay, meal: "lunch" }
                          )
                        }}
                      >
                        <Badge variant={meals.lunch.count > 0 ? "default" : "secondary"}>{meals.lunch.count}</Badge>
                        {hoverCell?.day === numericDay && hoverCell.meal === "lunch" && meals.lunch.count > 0 && (
                          <div className="absolute z-50 bottom-full mb-1 right-0 bg-popover border rounded-md p-2 shadow-lg max-h-60 overflow-auto min-w-max max-w-xs text-left">
                            {(meals.lunch.users?.length ?? 0) > 0
                              ? <div className="flex flex-wrap gap-1">
                                  {meals.lunch.users.map((name, i) => (
                                    <span key={`${name}-${i}`} className="bg-muted rounded px-2 py-0.5 text-xs break-words">{name}</span>
                                  ))}
                                </div>
                              : <span className="text-xs text-muted-foreground">申込者なし</span>}
                          </div>
                        )}
                      </td>
                      <td
                        className={`relative text-center p-2 ${hoverCell?.day === numericDay && hoverCell.meal === "dinner" ? "bg-accent/20" : ""} ${meals.dinner.count > 0 ? "cursor-pointer" : "cursor-default"}`}
                        onMouseEnter={() => {
                          if (meals.dinner.count > 0) setHoverCell({ day: numericDay, meal: "dinner" })
                        }}
                        onMouseLeave={() => setHoverCell(null)}
                        onClick={() => {
                          if (meals.dinner.count === 0) return
                          setHoverCell(prev =>
                            prev && prev.day === numericDay && prev.meal === "dinner"
                              ? null
                              : { day: numericDay, meal: "dinner" }
                          )
                        }}
                      >
                        <Badge variant={meals.dinner.count > 0 ? "default" : "secondary"}>{meals.dinner.count}</Badge>
                        {hoverCell?.day === numericDay && hoverCell.meal === "dinner" && meals.dinner.count > 0 && (
                          <div className="absolute z-50 bottom-full mb-1 right-0 bg-popover border rounded-md p-2 shadow-lg max-h-60 overflow-auto min-w-max max-w-xs text-left">
                            {(meals.dinner.users?.length ?? 0) > 0
                              ? <div className="flex flex-wrap gap-1">
                                  {meals.dinner.users.map((name, i) => (
                                    <span key={`${name}-${i}`} className="bg-muted rounded px-2 py-0.5 text-xs break-words">{name}</span>
                                  ))}
                                </div>
                              : <span className="text-xs text-muted-foreground">申込者なし</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="font-semibold">
                          {meals.breakfast.count + meals.lunch.count + meals.dinner.count}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
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
  )
}
