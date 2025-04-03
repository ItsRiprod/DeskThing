import { IconLogoGear } from '@renderer/assets/icons'
import { Icon, IconProps } from '@renderer/assets/icons/icon'
import { FC, useEffect, useState } from 'react'
import { useAppStore } from '@renderer/stores'

interface ActionIconProps extends IconProps {
  appId: string
  className?: string
}

export const AppIcon: FC<ActionIconProps> = ({ appId, className, ...props }) => {
  const getIcon = useAppStore((state) => state.getIcon)
  const [appIcon, setAppIcon] = useState<string | null>(null)
  const [lastAppId, setLastAppId] = useState<string | null>(null)

  useEffect(() => {
    if (appId && appId !== lastAppId) {
      setLastAppId(appId)
      getIcon(appId).then(setAppIcon)
    }
  }, [appId])

  return (
    <Icon {...props} key={appId} className={`${className} w-full h-full animate-pop-in`}>
      {appIcon ? <svg dangerouslySetInnerHTML={{ __html: appIcon }} /> : <IconLogoGear />}
    </Icon>
  )
}
