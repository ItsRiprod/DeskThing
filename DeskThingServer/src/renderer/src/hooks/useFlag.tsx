import { useCallback } from 'react'
import useSettingsStore from '../stores/settingsStore'

const useFlag = (
  flagId: string
): {
  flagState: boolean | undefined
  setFlag: (state: boolean) => Promise<void>
  toggle: () => Promise<boolean>
} => {
  const flagState = useSettingsStore((state) => state.settings.flag_misc?.[flagId])
  const setFlagStore = useSettingsStore((state) => state.setFlag)
  const toggleFlagStore = useSettingsStore((state) => state.toggleFlag)

  const setFlag = useCallback(
    async (state: boolean) => {
      await setFlagStore(flagId, state)
    },
    [flagId, setFlagStore]
  )

  const toggle = useCallback(async () => {
    const newState = await toggleFlagStore(flagId)
    return newState
  }, [flagId, toggleFlagStore])

  return { flagState, setFlag, toggle }
}

export default useFlag
