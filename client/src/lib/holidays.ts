import Holidays from "date-holidays"

const holidays = new Holidays({ country: "JP", types: ["public"] })

export function isJapaneseHoliday(date: Date): boolean {
  const holidayInfo = holidays.isHoliday(date)
  if (!holidayInfo) return false

  if (Array.isArray(holidayInfo)) {
    return holidayInfo.some((info) => info.type === "public")
  }

  return holidayInfo.type === "public"
}
