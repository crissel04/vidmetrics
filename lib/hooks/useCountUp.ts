'use client'

import { useState, useEffect } from 'react'

/**
 * Animates a number from 0 to the target value using requestAnimationFrame.
 * Uses an easeOut cubic curve for smooth deceleration.
 *
 * @param target - The final number to count up to
 * @param duration - Animation duration in ms (default 600)
 * @param enabled - When false, jumps directly to target (use for SSR and re-renders)
 * @returns The current animated value
 */
export function useCountUp(target: number, duration = 600, enabled = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    let start: number
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setValue(target)
      }
    }
    requestAnimationFrame(step)
  }, [target, duration, enabled])

  return value
}
