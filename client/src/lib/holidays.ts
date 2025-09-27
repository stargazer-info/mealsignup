import Holidays from "date-holidays"

const holidays = new Holidays("JP")

export function isJapaneseHoliday(date: Date): boolean {
  const holidayInfo = holidays.isHoliday(date, { types: ["public"] })
  if (!holidayInfo) return false
  return Array.isArray(holidayInfo) ? holidayInfo.length > 0 : true
}
