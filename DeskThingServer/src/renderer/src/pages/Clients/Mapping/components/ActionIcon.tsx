import { IconLogoGear } from '@renderer/assets/icons'
import { Icon, IconProps } from '@renderer/assets/icons/icon'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action, ActionReference } from '@shared/types'
import { FC, useEffect, useState } from 'react'

interface ActionIconProps extends IconProps {
  action: Action | undefined | ActionReference
  className?: string
}

export const ActionIcon: FC<ActionIconProps> = ({ action, className, ...props }) => {
  const getIcon = useMappingStore((state) => state.getIcon)
  const [actionIcon, setActionIcon] = useState<string | null>(null)

  useEffect(() => {
    const fetchIcon = async (): Promise<void> => {
      if (action) {
        const icon = await getIcon(action)
        setActionIcon(icon)
      }
    }
    action && fetchIcon()
  }, [action])

  return (
    <Icon {...props} className={className || 'w-full h-full'}>
      {actionIcon ? <svg dangerouslySetInnerHTML={{ __html: actionIcon }} /> : <IconLogoGear />}
    </Icon>
  )
}
