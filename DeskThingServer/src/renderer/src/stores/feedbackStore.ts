/**
 * @file FeedbackStore.ts
 * @description This file contains the FeedbackStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { FeedbackReport, SystemInfo } from '@shared/types'
import { create } from 'zustand'

interface FeedbackStoreState {
  systemData: SystemInfo
  feedback: Partial<FeedbackReport> | null
  addFeedbackData: (data: Partial<FeedbackReport>) => void
  submitFeedback: (feedback: Partial<FeedbackReport>) => void
  fetchSystemInfo: () => Promise<void>
  addSystemData: (data: Partial<SystemInfo>) => void
}

const useFeedbackStore = create<FeedbackStoreState>()((set) => ({
  systemData: {},
  feedback: null,

  addSystemData: (data): void => {
    set((sysData) => ({
      systemData: { ...sysData.systemData, ...data }
    }))
  },

  addFeedbackData: (data): void => {
    set((state) => ({
      feedback: { ...state.feedback, ...data }
    }))
  },

  fetchSystemInfo: async (): Promise<void> => {
    const systemInfo = await window.electron.feedback.getSysInfo()
    set((sysData) => ({
      systemData: { ...sysData.systemData, ...systemInfo }
    }))
  },

  submitFeedback: (feedback): void => {
    set({ feedback: null, systemData: {} })
    window.electron.feedback.submit(feedback as FeedbackReport)
  }
}))

export default useFeedbackStore
