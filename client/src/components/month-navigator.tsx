import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface MonthNavigatorProps {
  year: number
  month: number // 1-12
  onChange: (year: number, month: number) => void
  className?: string
  titleClassName?: string
  hideTitle?: boolean
}

export default function MonthNavigator({
  year,
  month,
  onChange,
  className,
  titleClassName,
  hideTitle = false,
}: MonthNavigatorProps) {
  const goPrev = () => {
    let y = year
    let m = month - 1
    if (m < 1) {
      y -= 1
      m = 12
    }
    onChange(y, m)
  }

  const goNext = () => {
    let y = year
    let m = month + 1
    if (m > 12) {
      y += 1
      m = 1
    }
    onChange(y, m)
  }

  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <Button variant="outline" size="sm" onClick={goPrev} className="p-2">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {!hideTitle && (
        <CardTitle className={`text-2xl font-bold text-primary ${titleClassName ?? ""}`}>
          {year}年 {month}月
        </CardTitle>
      )}
      <Button variant="outline" size="sm" onClick={goNext} className="p-2">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
