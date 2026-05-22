import { useState, useEffect } from 'react'
import { FONT, TEXT2 } from '../theme'

export default function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  const pad = n => String(n).padStart(2, '0')
  return (
    <span style={{ fontFamily: FONT, fontSize: '1.1vw', color: TEXT2, letterSpacing: '1px' }}>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())} UTC+2
    </span>
  )
}
