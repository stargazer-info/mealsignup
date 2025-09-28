import type { ReactNode } from "react"
import MonthNavigator from "@/components/month-navigator"

interface MonthSelectorHeaderProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
  title?: string
  className?: string
  children?: ReactNode
}

export default function MonthSelectorHeader({
  year,
  month,
  onChange,
  title,
  className = "",
  children
}: MonthSelectorHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div className="flex flex-col items-center md:items-start gap-2">
        {title && <h2 className="text-lg font-semibold text-primary">{title}</h2>}
        <MonthNavigator
          year={year}
          month={month}
          onChange={onChange}
          className="justify-center md:justify-start"
        />
      </div>
      {children && (
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  )
}
