import { FC, useEffect, useState } from 'react'
import { StepPropsMap } from '@shared/types'
import { STEP_TYPES } from '@deskthing/types'
import { useAppStore } from '@renderer/stores'
import { SettingsType } from '@deskthing/types'
import { IconCheck, IconX } from '@renderer/assets/icons'
import Button from '../Button'
import useTaskStore from '@renderer/stores/taskStore'
import Settings from '../settings'

export const TaskSettingComponent: FC<StepPropsMap[STEP_TYPES.SETTING]> = ({ step, source }) => {
  const completeStep = useTaskStore((state) => state.resolveStep)
  const updateStep = useTaskStore((state) => state.updateStep)
  const getSetting = useAppStore((state) => state.getAppSettings)
  const setAppSettings = useAppStore((state) => state.setAppSettings)
  const [stepCompleted, setIsComplete] = useState(false)
  const [setting, setSetting] = useState<SettingsType | null | undefined>(
    'type' in step.setting ? step.setting : null
  )

  useEffect(() => {
    if (!('type' in step.setting)) {
      // There is no type. This is a setting reference to an app setting.
      const fetchSetting = async (): Promise<void> => {
        const settings = await getSetting(step.setting.source || source)
        if (step.setting.id && settings?.[step.setting.id]) {
          setSetting(settings[step.setting.id])
        }
      }
      fetchSetting()
    }
  }, [source, step.setting, getSetting])

  useEffect(() => {
    if (setting && setting.value) {
      // if the value has any value
      setIsComplete(true)
    }
  }, [setting])

  const handleComplete = async (): Promise<void> => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }

    // Task is modifying one of the app's settings
    if (!('type' in step.setting) && setting) {
      const settings = await getSetting(source)
      if (settings) {
        if (settings[step.setting.id].type == setting.type) {
          const updatedSetting: SettingsType = settings[step.setting.id]
          updatedSetting.value = setting.value
          updatedSetting.id = step.setting.id

          setAppSettings(source, {
            ...settings,
            [updatedSetting.id]: { ...updatedSetting, id: step.setting.id }
          })
        }
      }
    } else {
      // task is modifying a custom setting
      if (setting) {
        await updateStep(step.parentId, { id: step.id, setting: setting })
      }
    }
    await completeStep(step.parentId, step.id, source)
  }

  const handleSettingChange = (value: SettingsType['value']): void => {
    setIsComplete(true)
    if (setting) {
      console.log('Changing the settings', setting.value)
      setSetting((settingType) => {
        if (!settingType) {
          return 'type' in step.setting ? step.setting : null
        }
        console.log('Setting is now', settingType.value)
        return {
          ...settingType,
          value
        } as SettingsType
      })
    } else {
      console.log('Not changing', setting)
    }
  }

  return (
    <div>
      <p className="font-semibold">{step?.label}</p>
      <p>{step?.instructions}</p>
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
          {stepCompleted || !step.strict ? <p>Mark as Completed</p> : <p>Change Setting First</p>}
          {stepCompleted || !step.strict ? <IconCheck /> : <IconX />}
        </Button>
      )}
    </div>
  )
}

export default TaskSettingComponent
