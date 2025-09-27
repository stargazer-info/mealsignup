import Holidays from "date-holidays"

const holidays = new Holidays("JP", { types: ["public"] })

export function isJapaneseHoliday(date: Date): boolean {
  const holidayInfo = holidays.isHoliday(date)
  if (!holidayInfo) return false

  const holidayArray = Array.isArray(holidayInfo) ? holidayInfo : [holidayInfo]
  return holidayArray.some((info) => (info as { type?: string }).type === "public")
}
