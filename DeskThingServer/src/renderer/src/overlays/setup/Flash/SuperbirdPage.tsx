import React, { FC, useEffect, useMemo, useState } from 'react'
import { FirmwarePage } from './FirmwarePage'
import { DriverPage } from './DriverPage'
import { FlashPage } from './FlashPage'
import { IconProps } from '@renderer/assets/icons/icon'
import { IconLightning, IconArrowLeft, IconDownload, IconGear } from '@renderer/assets/icons'
import { DashboardPage } from './Dashboard'
import Button from '@renderer/components/buttons/Button'
import { AutoConfig } from './AutoConfig'
import useFlashStore from '@renderer/stores/flashStore'

export interface SuperbirdPageProps {
  onComplete: (completionText: string) => void
}

export type PageOutline = Record<
  string,
  {
    completed: boolean
    page: FC<SuperbirdPageProps>
    icon: FC<IconProps>
    requires?: string[]
    text: string
    completionText?: string
  }
>

export type FlashPages = 'firmware' | 'driver' | 'flash' | 'dashboard' | 'autoconfig'

const SuperbirdPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FlashPages>('dashboard')
  const [pages, setPages] = useState<PageOutline>({
    firmware: {
      completed: false,
      page: FirmwarePage,
      icon: IconDownload,
      requires: [],
      text: 'Download Firmware',
      completionText: ''
    },
    driver: {
      completed: false,
      page: DriverPage,
      icon: IconGear,
      requires: [],
      text: 'Configure Driver',
      completionText: ''
    },
    flash: {
      completed: false,
      page: FlashPage,
      icon: IconLightning,
      requires: ['firmware', 'driver'],
      text: 'Flash Device',
      completionText: ''
    }
  })

  const getCurrentStatus = useFlashStore((state) => state.getFlashState)

  useEffect(() => {
    const checkCurrentStatus = async (): Promise<void> => {
      const state = await getCurrentStatus()
      if (state?.state == 'progress') {
        setPages((prev) => ({
          ...prev,
          firmware: {
            ...prev.firmware,
            completed: true,
            completionText: 'Firmware Loaded'
          },
          driver: {
            ...prev.driver,
            completed: true,
            completionText: 'Driver installed successfully'
          }
        }))
      }
    }

    checkCurrentStatus()
  }, [])

  const onComplete = (completionText: string): void => {
    if (currentPage == 'dashboard') return
    if (currentPage == 'autoconfig') return

    setPages((prev) => ({
      ...prev,
      [currentPage]: {
        ...prev[currentPage],
        completed: true,
        completionText
      }
    }))
  }

  const CurrentPage: FC<SuperbirdPageProps> | undefined = useMemo(() => {
    if (currentPage == 'dashboard') return
    if (currentPage == 'autoconfig') return
    const PageComponent = pages[currentPage].page
    return PageComponent
  }, [currentPage])

  return (
    <div className="w-full h-full flex flex-col">
      {currentPage !== 'dashboard' && (
        <Button
          className="absolute top-1 left-1 w-fit text-white rounded"
          onClick={() => setCurrentPage('dashboard')}
        >
          <IconArrowLeft />
          Go Back
        </Button>
      )}
      {currentPage == 'dashboard' ? (
        <DashboardPage pages={pages} openPage={setCurrentPage} />
      ) : currentPage == 'autoconfig' ? (
        <AutoConfig />
      ) : (
        CurrentPage && <CurrentPage onComplete={onComplete} />
      )}
    </div>
  )
}

export default SuperbirdPage
