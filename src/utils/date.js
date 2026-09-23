const GEAR_DAY_OFFSET_HOURS = 4

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function localDateStr(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function todayStr() {
  return localDateStr(new Date())
}

// A "gear day" doesn't roll over at midnight — it rolls over at 4am, so staying
// up late still counts toward the day that's ending, not the next one.
export function gearDayStr(date = new Date()) {
  return localDateStr(new Date(date.getTime() - GEAR_DAY_OFFSET_HOURS * 60 * 60 * 1000))
}

export function shiftDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return localDateStr(dt)
}

export function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// Oldest → newest, ending at endDateStr (inclusive).
export function pastDates(endDateStr, count) {
  const dates = []
  for (let i = count - 1; i >= 0; i--) dates.push(shiftDateStr(endDateStr, -i))
  return dates
}

