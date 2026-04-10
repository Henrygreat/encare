'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface InactivityConfig {
  timeoutMs: number
  warningMs: number
  onWarning: () => void
  onTimeout: () => void
  onActivity?: () => void
  enabled?: boolean
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const

export function useInactivity({
  timeoutMs,
  warningMs,
  onWarning,
  onTimeout,
  onActivity,
  enabled = true,
}: InactivityConfig) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isWarningShownRef = useRef(false)
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    const remainingTime = Math.ceil((timeoutMs - warningMs) / 1000)
    setRemainingSeconds(remainingTime)

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timeoutMs, warningMs])

  const resetTimers = useCallback(() => {
    if (!enabled) return

    clearTimers()
    lastActivityRef.current = Date.now()

    if (isWarningShownRef.current) {
      isWarningShownRef.current = false
      setIsWarningVisible(false)
      onActivity?.()
    }

    warningRef.current = setTimeout(() => {
      isWarningShownRef.current = true
      setIsWarningVisible(true)
      onWarning()
      startCountdown()
    }, warningMs)

    timeoutRef.current = setTimeout(() => {
      onTimeout()
    }, timeoutMs)
  }, [enabled, clearTimers, warningMs, timeoutMs, onWarning, onTimeout, onActivity, startCountdown])

  const handleActivity = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  const dismissWarning = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    resetTimers()

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled, handleActivity, resetTimers, clearTimers])

  return {
    isWarningVisible,
    remainingSeconds,
    dismissWarning,
    resetTimers,
  }
}

export const INACTIVITY_DEFAULTS = {
  TIMEOUT_MS: 15 * 60 * 1000,
  WARNING_MS: 13 * 60 * 1000,
} as const
