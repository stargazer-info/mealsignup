import type { ReactNode } from "react"
import MonthSelectorHeader from "@/components/month-selector-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader } from "@/components/ui/card"

interface GroupData {
  id: string
  name: string
  userName: string
  inviteCode: string
}

interface GroupContextHeaderProps {
  groupData: GroupData
  year: number
  month: number
  onYearMonthChange: (year: number, month: number) => void
  children?: ReactNode
}

export default function GroupContextHeader({
  groupData,
  year,
  month,
  onYearMonthChange,
  children
}: GroupContextHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-lg">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="font-semibold text-foreground text-sm sm:text-base">
              グループ名: {groupData.name || "N/A"}
            </span>
            <Badge variant="outline" className="text-xs sm:text-sm px-2 py-0.5 break-all max-w-[200px] sm:max-w-none">
              招待コード: {groupData.inviteCode || "N/A"}
            </Badge>
          </div>
        </div>
      </div>
      <Card className="bg-card">
        <CardHeader className="px-2 sm:px-6 pb-4">
          <MonthSelectorHeader
            year={year}
            month={month}
            onChange={onYearMonthChange}
            className="justify-center"
          />
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}
