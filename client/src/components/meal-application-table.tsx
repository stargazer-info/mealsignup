"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Utensils, Moon, Check, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/clerk-react"
import { saveMealSignupApi } from "@/api/meals"
import { fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup } from "@/api/mealSignup"
import { isJapaneseHoliday } from "@/lib/holidays"
import type { GroupData } from "@/types/GroupData"

type MealStatus = "applied" | "not-applied"

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
  const [mealData, setMealData] = useState<Record<number, { breakfast: boolean; lunch: boolean; dinner: boolean }>>({})
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const fetchMealData = useCallback(async () => {
    try {
      const data = await fetchSelfMonthlyMealSignup(year, month, getToken, groupData?.id ?? '')
      const formattedData = data.reduce((acc: Record<number, { breakfast: boolean; lunch: boolean; dinner: boolean }>, item: { day: number; breakfast: boolean; lunch: boolean; dinner: boolean }) => {
        acc[item.day] = { breakfast: item.breakfast, lunch: item.lunch, dinner: item.dinner }
        return acc
      }, {})
      setMealData(formattedData)
    } catch (error) {
      console.error("Failed to fetch meal data:", error)
    }
  }, [year, month, groupData?.id, getToken])

  useEffect(() => {
    if (groupData?.id) {
      fetchMealData()
    }
  }, [fetchMealData, groupData?.id])

  const daysInMonth = getDaysInMonth(year, month)
  const today = new Date()

  const toggleMealStatus = async (day: number, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!groupData) return

    const currentDayData = mealData[day] || { breakfast: false, lunch: false, dinner: false }
    const newStatus = !currentDayData[mealType]

    const updatedDayData = {
      ...currentDayData,
      [mealType]: newStatus,
    }

    setMealData(prevData => ({ ...prevData, [day]: updatedDayData }))

    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      await saveMealSignupApi(dateStr, updatedDayData, groupData.id, getToken)
    } catch (error) {
      console.error("Failed to update meal status:", error)
      setMealData(prevData => ({
        ...prevData,
        [day]: currentDayData
      }))
    }
  }

  const handleBulkUpdate = async (apply: boolean) => {
    if (!groupData) return

    const originalMealData = { ...mealData }
    setIsBulkUpdating(true)

    const daysInMonthValue = getDaysInMonth(year, month)
    const newMealData: typeof mealData = {}
    const monthlySignupPayload = []
    for (let day = 1; day <= daysInMonthValue; day++) {
      newMealData[day] = { breakfast: apply, lunch: apply, dinner: apply }
      monthlySignupPayload.push({ day, breakfast: apply, lunch: apply, dinner: apply })
    }
    setMealData(newMealData)

    try {
      await saveSelfMonthlyMealSignup(monthlySignupPayload, year, month, groupData.id, getToken)
    } catch (error) {
      console.error(`Failed to ${apply ? 'apply' : 'cancel'} all meals:`, error)
      setMealData(originalMealData)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const applyAllMeals = () => handleBulkUpdate(true)
  const cancelAllMeals = () => handleBulkUpdate(false)

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
                    <Moon classNameを```
