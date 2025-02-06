import { FC, useEffect, useState } from 'react'
import { StepProps } from './TaskBase'
import { STEP_TYPES } from '@shared/types/tasks'
import { useAppStore } from '@renderer/stores'
import { SettingsType } from '@shared/types'
import { IconCheck, IconX } from '@renderer/assets/icons'
import Button from '../Button'
import useTaskStore from '@renderer/stores/taskStore'
import Settings from '../settings'

export const TaskSetting: FC<StepProps> = ({ step, source }) => {
  if (step.type != STEP_TYPES.SETTING) return <div>Not a Setting</div>

  const completeStep = useTaskStore((state) => state.resolveStep)
  const updateStep = useTaskStore((state) => state.updateStep)
  const getSetting = useAppStore((state) => state.getAppSettings)
  const setAppSettings = useAppStore((state) => state.setAppSettings)
  const [stepCompleted, setIsComplete] = useState(false)
  const [setting, setSetting] = useState<SettingsType | null>(
    typeof step.setting !== 'string' ? step.setting : null
  )

  useEffect(() => {
    if (typeof step.setting === 'string') {
      const fetchSetting = async (): Promise<void> => {
        const settings = await getSetting(source)
        if (settings?.[step.setting as string]) {
          setSetting(settings[step.setting as string])
        }
      }
      fetchSetting()
    }
  }, [source, step.setting, getSetting])

  const handleComplete = async (): Promise<void> => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }

    // Task is modifying one of the app's settings
    if (setting && typeof step.setting === 'string') {
      const settings = await getSetting(source)
      if (settings) {
        if (settings[step.setting].type == setting.type) {
          const updatedSetting: SettingsType = settings[step.setting]
          updatedSetting.value = setting.value

          setAppSettings(source, {
            ...settings,
            [step.setting]: updatedSetting
          })
        }
      }
    } else {
      // task is modifying a custom setting
      if (setting) {
        await updateStep(step.parentId, { id: step.id, setting: setting })
      }
    }
    await completeStep(step.parentId, step.id)
  }

  const handleSettingChange = (value: SettingsType['value']): void => {
    setIsComplete(true)
    if (setting) {
      console.log('Changing the settings')
      setting.value
      setSetting((settingType) => {
        if (!settingType) return setting
        settingType.value = value
        return settingType
      })
    } else {
      console.log('Not changing', setting)
    }
  }

  return (
    <div>
      {step?.label}
      {step?.instructions}
      {setting ? (
        <Settings handleSettingChange={handleSettingChange} setting={setting} />
      ) : (
        <p>Unable to find setting</p>
      )}
      {step.debug != true && (
        <Button
          className={`w-full justify-center group ${stepCompleted ? 'bg-green-700 hover:bg-green-600' : 'bg-zinc-950 text-gray-500'}`}
          disabled={step.strict && !stepCompleted}
          title={`${stepCompleted ? 'Confirm Completion' : step.strict ? 'Modify setting first' : 'Continue Anyway'}`}
          onClick={handleComplete}
        >
          {stepCompleted || !step.strict ? <p>Mark as Completed</p> : <p>Open Link First</p>}
          {stepCompleted || !step.strict ? <IconCheck /> : <IconX />}
        </Button>
      )}
    </div>
  )
}

export default TaskSetting
