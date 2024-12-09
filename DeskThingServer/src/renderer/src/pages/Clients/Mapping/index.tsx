import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconAlbum,
  IconCarThingSmall,
  IconCheckCircle,
  IconComputer,
  IconDownload,
  IconLayoutgrid,
  IconMusic,
  IconPlus,
  IconSave,
  IconTrash,
  IconUpload
} from '@renderer/assets/icons'
import MainElement from '@renderer/nav/MainElement'
import useMappingStore from '@renderer/stores/mappingStore'
import { ButtonMapping, EventMode, Key, Profile } from '@shared/types'
import CarThingPage from './pages/CarThingPage'
import WheelPage from './pages/WeaponWheelPage'
import MiniplayerPage from './pages/MiniplayerPage'
import TrayPage from './pages/TrayPage'
import AppMappingsPage from './pages/AppMappingsPage'
import { IconProps } from '@renderer/assets/icons/icon'
import MappingPage from './MappingPage'
import { useSearchParams } from 'react-router-dom'
import Tooltip from '@renderer/components/Tooltip'

export interface PageProps {
  onMappingChange?: () => void
  selectedKey: Key | undefined
  setSelectedKey: (key: Key) => void
  currentMapping: ButtonMapping
  setCurrentMode: (mode: EventMode) => void
  mode: EventMode
}

interface Page {
  component: React.FC<PageProps>
  icon: React.FC<IconProps>
  label: string
  id: string
  keyList: string[]
}

interface PagesInterface {
  [key: string]: Page
}

const pages: PagesInterface = {
  carthing: {
    keyList: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Escape', 'Swipe'],
    id: 'carthing',
    icon: IconCarThingSmall,
    component: CarThingPage,
    label: 'CarThing'
  },
  miniplayer: {
    keyList: [
      'DynamicAction1',
      'DynamicAction2',
      'DynamicAction3',
      'DynamicAction4',
      'Action5',
      'Action6',
      'Action7'
    ],
    id: 'miniplayer',
    icon: IconMusic,
    component: MiniplayerPage,
    label: 'Miniplayer'
  },
  tray: {
    keyList: ['Tray1', 'Tray2', 'Tray3', 'Tray4', 'Tray5', 'Tray6'],
    id: 'tray',
    icon: IconComputer,
    component: TrayPage,
    label: 'Tray'
  },
  wheel: {
    keyList: ['Wheel1', 'Wheel2', 'Wheel3', 'Wheel4', 'Scroll', 'Enter'],
    id: 'wheel',
    icon: IconAlbum,
    component: WheelPage,
    label: 'Wheel'
  },
  apps: {
    keyList: [],
    id: 'apps',
    icon: IconLayoutgrid,
    component: AppMappingsPage,
    label: 'Apps'
  }
}

const ClientMappingPage: React.FC = () => {
  const activeProfile = useMappingStore((state) => state.currentProfile)
  const mapping = useMappingStore((state) => state.currentMapping)
  const getProfiles = useMappingStore((state) => state.getProfiles)
  const getProfile = useMappingStore((state) => state.getProfile)

  const [activeChanges, setActiveChanges] = useState(false)

  const setCurrentProfile = useMappingStore((state) => state.setCurrentProfile)

  const saveProfile = useMappingStore((state) => state.saveProfile)
  const deleteProfile = useMappingStore((state) => state.deleteProfile)

  const [currentMapping, setCurrentMapping] = useState<ButtonMapping>(mapping)
  const [selectedProfile, setSelectedProfile] = useState<Profile>(activeProfile)

  const [profiles, setProfiles] = useState<Profile[]>([])

  const [selectedPage, setSelectedPage] = useState<Page>(pages['carthing'])

  const [_searchParams, setSearchParams] = useSearchParams()

  // Startup Stuff

  useEffect(() => {
    const getData = async (): Promise<void> => {
      setProfiles(await getProfiles())
    }
    getData()
  }, [])

  useEffect(() => {
    setActiveChanges(false)
  }, [selectedProfile])

  useEffect(() => {
    setCurrentMapping(mapping)
    const getData = async (): Promise<void> => {
      setProfiles(await getProfiles())
      console.log('Setting Profiles')
    }

    getData()
  }, [mapping])

  // Functionality Stuff

  const handleAddProfile = async (): Promise<void> => {
    setSearchParams({ addProfile: 'true' })
  }

  // UI Stuff

  const handleProfileChange = async (profile: Profile): Promise<void> => {
    setSelectedProfile(profile)
    const mapping = await getProfile(profile.id)
    setCurrentMapping(mapping)
  }

  const handlePageChange = async (page: string): Promise<void> => {
    if (pages[page]) {
      setSelectedPage(pages[page])
    }
  }

  const handleSaveMapping = async (): Promise<void> => {
    console.log('Saving')
    if (currentMapping.id == 'default') {
      console.error('Cannot save default profile')
    } else {
      saveProfile(currentMapping)
    }
    setActiveChanges(false)
  }

  const handleDeleteProfile = async (profile: Profile): Promise<void> => {
    deleteProfile(profile.id)
    setProfiles(await getProfiles())
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="justify-between">
        <div className="w-full justify-between h-full flex-col flex">
          <div className="w-full gap-2 flex flex-col">
            <p className="w-full border-b border-gray-500">Profiles</p>
            <div className="border-b max-h-32 overflow-y-auto border-gray-500 flex flex-col gap-1 py-2">
              {profiles.map((profile) => (
                <Button
                  key={profile.id}
                  className={`hover:bg-zinc-900 gap-2 ${selectedProfile.id === profile.id ? 'border border-green-500' : ''}`}
                  onClick={() => handleProfileChange(profile)}
                >
                  {activeProfile.id == profile.id && (
                    <IconCheckCircle className="xs:hidden md:block" strokeWidth={4} />
                  )}
                  <p className="text-ellipsis overflow-hidden whitespace-nowrap">{profile.name}</p>
                </Button>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-1">
              {activeProfile.id != selectedProfile.id ? (
                <>
                  <Button
                    onClick={() => handleDeleteProfile(selectedProfile)}
                    className="relative border-gray-900 border gap-2 justify-center hover:bg-zinc-900"
                  >
                    <IconTrash iconSize={24} />
                    <Tooltip text="Delete Profile" bottom={true} />
                    <p className="xs:hidden">Delete</p>
                  </Button>
                  <Button
                    onClick={() => setCurrentProfile(selectedProfile)}
                    className="relative border-gray-900 border gap-2 justify-center hover:bg-zinc-900"
                  >
                    <IconCheckCircle strokeWidth={4} iconSize={24} />
                    <Tooltip text="Switch To Profile" bottom={true} />
                    <p className="xs:hidden">Set</p>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="relative border-gray-900 border gap-2 justify-center hover:bg-zinc-900">
                    <IconUpload iconSize={24} />
                    <Tooltip text="Export Profile" bottom={true} />
                    <p className="xs:hidden">Export</p>
                  </Button>
                  <Button className="relative border-gray-900 border gap-2 justify-center hover:bg-zinc-900">
                    <IconDownload iconSize={24} />
                    <Tooltip text="Import Profile" bottom={true} />
                    <p className="xs:hidden">Import</p>
                  </Button>
                </>
              )}
              {activeChanges ? (
                <Button
                  onClick={handleSaveMapping}
                  className="relative text-red-500 border-gray-900 border gap-2 justify-center hover:bg-zinc-900"
                >
                  <IconSave strokeWidth={2} iconSize={24} />
                  <Tooltip text="Save Profile" bottom={true} />
                  <p className="xs:hidden">Save</p>
                </Button>
              ) : (
                <Button
                  onClick={handleAddProfile}
                  className="relative border-gray-900 border justify-center hover:bg-zinc-900"
                >
                  <IconPlus iconSize={24} />
                  <Tooltip text="Create Profile" bottom={true} />
                  <p className="xs:hidden">Create</p>
                </Button>
              )}
            </div>
            {activeChanges && (
              <p className="text-red-500 xs:hidden md:block italic text-xs w-full text-right">
                Unsaved Changes!
              </p>
            )}
          </div>
        </div>

        <div className="w-full gap-1 max-h-48 overflow-y-auto border-t py-2 border-gray-700 flex-col flex">
          {Object.values(pages).map((page) => (
            <Button
              key={page.id}
              className={`hover:bg-zinc-900 gap-2 ${selectedPage.id == page.id && 'border border-green-500'}`}
              onClick={() => handlePageChange(page.id)}
            >
              <page.icon strokeWidth={2} iconSize={24} />
              <p className="xs:hidden md:block">{page.label}</p>
            </Button>
          ))}
        </div>
      </Sidebar>
      <MainElement className="">
        <MappingPage
          currentMapping={currentMapping}
          setCurrentMapping={setCurrentMapping}
          KeyList={selectedPage.keyList}
          Component={selectedPage.component}
          setActiveChanges={setActiveChanges}
        />
      </MainElement>
    </div>
  )
}

export default ClientMappingPage
