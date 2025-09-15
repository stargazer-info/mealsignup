"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [hoverCell, setHoverCell] = useState<{ day: number; meal: 'breakfast'|'lunch'|'dinner' } | null>(null)

  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const displayGroupName = groupData?.name
  const displayInviteCode = groupData?.inviteCode

  const loadSummary = useCallback(async () => {
    if (!groupData) return
    setIsLoading(true)
    try {
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
  }, [currentDate, groupData?.id])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])



  return (
    <div className="space-y-6">
        {/* グループ情報 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-lg">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-foreground">
                グループ名: {displayGroupName || "N/A"}
              </span>
              <Badge variant="outline" className="text-sm px-3 py-1 break-all max-w-[200px] sm:max-w-none">
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
          <CardHeader className="px-2 sm:px-6 pb-4">
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
                  ) : Object.keys(dailySummary).length > 0 ? (
                    Object.entries(dailySummary).map(([day, meals]) => (
                      <tr key={day} className={`border-b ${(() => {
                        const now = new Date()
                        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), Number(day))
                        return d.getFullYear() === now.getFullYear()
                          && d.getMonth() === now.getMonth()
                          && d.getDate() === now.getDate()
                          ? 'bg-accent/10'
                          : ''
                      })()}`}>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-base sm:text-lg ${(() => {
                              const weekday = new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                Number(day)
                              ).getDay()
                              if (weekday === 0) return 'text-red-600' // 日曜
                              if (weekday === 6) return 'text-blue-600' // 土曜
                              return ''
                            })()}`}>{day}日</span>
                            <span className={`text-[11px] sm:text-sm ${(() => {
                              const weekday = new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                Number(day)
                              ).getDay()
                              if (weekday === 0) return 'text-red-600' // 日曜
                              if (weekday === 6) return 'text-blue-600' // 土曜
                              return 'text-muted-foreground'
                            })()}`}>
                              (
                              {new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                Number(day)
                              ).toLocaleDateString("ja-JP", { weekday: "short" })}
                              )
                            </span>
                          </div>
                        </td>
                        <td 
                          className={`relative text-center p-2 ${hoverCell?.day === Number(day) && hoverCell.meal === 'breakfast' ? 'bg-accent/20' : ''} ${meals.breakfast.count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                          onMouseEnter={() => {
                            if (meals.breakfast.count > 0) setHoverCell({ day: Number(day), meal: 'breakfast' })
                          }}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() => {
                            if (meals.breakfast.count === 0) return
                            setHoverCell(prev =>
                              prev && prev.day === Number(day) && prev.meal === 'breakfast'
                                ? null
                                : { day: Number(day), meal: 'breakfast' }
                            )
                          }}
                        >
                          <Badge variant={meals.breakfast.count > 0 ? "default" : "secondary"}>{meals.breakfast.count}</Badge>
                          {hoverCell?.day === Number(day) && hoverCell.meal === 'breakfast' && meals.breakfast.count > 0 && (
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
                          className={`relative text-center p-2 ${hoverCell?.day === Number(day) && hoverCell.meal === 'lunch' ? 'bg-accent/20' : ''} ${meals.lunch.count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                          onMouseEnter={() => {
                            if (meals.lunch.count > 0) setHoverCell({ day: Number(day), meal: 'lunch' })
                          }}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() => {
                            if (meals.lunch.count === 0) return
                            setHoverCell(prev =>
                              prev && prev.day === Number(day) && prev.meal === 'lunch'
                                ? null
                                : { day: Number(day), meal: 'lunch' }
                            )
                          }}
                        >
                          <Badge variant={meals.lunch.count > 0 ? "default" : "secondary"}>{meals.lunch.count}</Badge>
                          {hoverCell?.day === Number(day) && hoverCell.meal === 'lunch' && meals.lunch.count > 0 && (
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
                          className={`relative text-center p-2 ${hoverCell?.day === Number(day) && hoverCell.meal === 'dinner' ? 'bg-accent/20' : ''} ${meals.dinner.count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                          onMouseEnter={() => {
                            if (meals.dinner.count > 0) setHoverCell({ day: Number(day), meal: 'dinner' })
                          }}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() => {
                            if (meals.dinner.count === 0) return
                            setHoverCell(prev =>
                              prev && prev.day === Number(day) && prev.meal === 'dinner'
                                ? null
                                : { day: Number(day), meal: 'dinner' }
                            )
                          }}
                        >
                          <Badge variant={meals.dinner.count > 0 ? "default" : "secondary"}>{meals.dinner.count}</Badge>
                          {hoverCell?.day === Number(day) && hoverCell.meal === 'dinner' && meals.dinner.count > 0 && (
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
