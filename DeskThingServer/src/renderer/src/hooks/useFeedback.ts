/**
 * @file useFeedback.ts
 * @description Custom hook for managing feedback submission and system information
 * @author Riprod
 * @version 0.10.4
 */
import { useState, useCallback } from 'react'
import { FeedbackReport, SystemInfo } from '@shared/types'

interface FeedbackHook {
  systemData: SystemInfo
  feedback: Partial<FeedbackReport> | null
  addSystemData: (data: Partial<SystemInfo>) => void
  addFeedbackData: (data: Partial<FeedbackReport>) => void
  fetchSystemInfo: () => Promise<void>
  submitFeedback: (feedbackData: Partial<FeedbackReport>) => void
}

export function useFeedback(): FeedbackHook {
  const [systemData, setSystemData] = useState<SystemInfo>({})
  const [feedback, setFeedback] = useState<Partial<FeedbackReport> | null>(null)

  const addSystemData = useCallback((data: Partial<SystemInfo>): void => {
    setSystemData((prevData) => ({ ...prevData, ...data }))
  }, [])

  const addFeedbackData = useCallback((data: Partial<FeedbackReport>): void => {
    setFeedback((prevFeedback) => ({ ...prevFeedback, ...data }))
  }, [])

  const fetchSystemInfo = useCallback(async (): Promise<void> => {
    const systemInfo = await window.electron.feedback.getSysInfo()
    setSystemData((prevData) => ({ ...prevData, ...systemInfo }))
  }, [])

  const submitFeedback = useCallback((feedbackData: Partial<FeedbackReport>): void => {
    setFeedback(null)
    setSystemData({})
    window.electron.feedback.submit(feedbackData as FeedbackReport)
  }, [])

  return {
    systemData,
    feedback,
    addSystemData,
    addFeedbackData,
    fetchSystemInfo,
    submitFeedback
  }
}
