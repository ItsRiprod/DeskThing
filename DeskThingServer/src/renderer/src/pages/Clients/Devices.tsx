import React, { useState, useEffect } from 'react'
import Sidebar from '@renderer/components/SideBar'
import { useClientStore, useSettingsStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import {
  IconComputer,
  IconGear,
  IconGlobe,
  IconRefresh,
  IconRefreshDisabled
} from '@renderer/assets/icons'
import DeviceComponent from '@renderer/components/Device'
import { deviceMessages } from '@renderer/assets/refreshMessages'
import MainElement from '@renderer/components/MainElement'

const ClientDevices: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const devices = useClientStore((clients) => clients.ADBDevices)
  const refreshClients = useClientStore((clients) => clients.requestADBDevices)
  const saveSettings = useSettingsStore((state) => state.saveSettings)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    if (devices.length === 0) {
      const eligibleMessages = deviceMessages.filter((msg) => msg.minimum <= refreshCount)
      const totalWeight = eligibleMessages.reduce((sum, msg) => sum + msg.weight, 0)
      let randomWeight = Math.random() * totalWeight
      let selectedIndex = 0

      for (let i = 0; i < eligibleMessages.length; i++) {
        randomWeight -= eligibleMessages[i].weight
        if (randomWeight <= 0) {
          selectedIndex = deviceMessages.findIndex(
            (msg) => msg.message === eligibleMessages[i].message
          )
          break
        }
      }

      setCurrentMessageIndex(selectedIndex)
    }
  }, [refreshCount])

  const toggleADB = (): void => {
    saveSettings({ ...settings, globalADB: !settings.globalADB })
  }

  const toggleAutoADB = (): void => {
    console.log('Setting Auto-Detect ADB to', !settings.autoDetectADB)
    saveSettings({ ...settings, autoDetectADB: !settings.autoDetectADB })
  }

  const handleRefresh = (): void => {
    if (!isRefreshing) {
      setIsRefreshing(true)
      refreshClients()
      setRefreshCount((prevCount) => prevCount + 1)
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1200)
    }
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-between flex-col h-full md:items-stretch items-center">
        <div></div>
        <div className="flex flex-col gap-2">
          <Button
            className={`border-gray-500 hover:bg-gray-500 ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <IconRefresh strokeWidth={1.5} className={isRefreshing ? 'animate-spin' : ''} />
            <p className="md:block hidden text-center flex-grow">
              {isRefreshing ? 'Searching...' : 'Refresh'}
            </p>
          </Button>
          <Button className="border-gray-500 hover:bg-gray-500">
            <IconGear strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Client Settings</p>
          </Button>
          <Button className={`group border-gray-500 hover:bg-gray-500`} onClick={toggleAutoADB}>
            {settings.autoDetectADB ? (
              <>
                <IconRefresh strokeWidth={1.5} />
                <p className="md:group-hover:block hidden text-center flex-grow">Disable</p>
              </>
            ) : (
              <>
                <IconRefreshDisabled strokeWidth={1.5} />
                <p className="md:group-hover:block hidden text-center flex-grow">Enable</p>
              </>
            )}
            <p className="group-hover:hidden hidden md:block text-center flex-grow">Auto Detect</p>
          </Button>
          <Button className="border-gray-500 hover:bg-gray-500 group" onClick={toggleADB}>
            {settings.globalADB ? (
              <>
                <IconGlobe strokeWidth={1.5} />
                <div className="md:flex hidden h-full text-center flex-grow items-center justify-center">
                  <p className="group-hover:hidden">Global ADB</p>
                  <p className="group-hover:block hidden">Use Local</p>
                </div>
              </>
            ) : (
              <>
                <IconComputer strokeWidth={1.5} />
                <div className="md:flex hidden h-full text-center flex-grow items-center justify-center">
                  <p className="group-hover:hidden">Local ADB</p>
                  <p className="group-hover:block hidden">Use Global</p>
                </div>
              </>
            )}
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <h1 className="text-2xl font-bold mb-4">Connected Devices</h1>
        <div className="flex-grow">
          {devices.length > 0 ? (
            devices.map((device) => (
              <div key={device} className="w-full">
                <DeviceComponent device={device} />
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center w-full h-full">
              <p className="text-white">{deviceMessages[currentMessageIndex].message}</p>
            </div>
          )}
        </div>
      </MainElement>
    </div>
  )
}

export default ClientDevices
