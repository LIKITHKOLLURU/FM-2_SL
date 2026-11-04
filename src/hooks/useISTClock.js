import { useEffect, useState } from 'react'
import { formatDate, formatTime } from '../utils/datetime.js'

// Live "now" in India; re-renders only the component that uses it.
export function useISTClock(intervalMs = 15000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return { date: formatDate(now), time: formatTime(now) }
}
