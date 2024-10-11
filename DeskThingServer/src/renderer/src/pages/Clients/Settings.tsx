import React from 'react'
import Sidebar from '@renderer/components/SideBar'
import Button from '@renderer/components/Button'
import { IconPlus } from '@renderer/assets/icons'

const ClientSettings: React.FC = () => {
  return (
    <div className="flex h-full w-full">
      <Sidebar>
        <div className="w-full justify-between h-full flex-col flex">
          <div className="w-full gap-2 flex flex-col">
            <p className="w-full text-center border-b-2">Profiles</p>
            <Button className="bg-gray-500 border-gray-500 justify-center hover:bg-gray-600">
              Default
            </Button>
          </div>
          <Button className="bg-gray-500 border-gray-500 justify-center hover:bg-gray-600">
            <IconPlus iconSize={24} />
          </Button>
        </div>

        <div className="w-full justify-between h-full flex-col flex">
          <div className="w-full gap-2 flex flex-col">
            <p className="w-full text-center border-b-2">Actions</p>
            <Button className="bg-gray-500 border-gray-500 hover:bg-gray-600 justify-center">
              Server
            </Button>
          </div>
          <Button className="bg-gray-500 border-gray-500 justify-center hover:bg-gray-600">
            <IconPlus iconSize={24} />
          </Button>
        </div>
      </Sidebar>
      <div className="flex flex-col w-full">
        <div className="w-full h-full flex">
          <div className="border-r-white border-r-2 h-full w-1/2">
            <p>BUTTONS</p>
          </div>
          <div className="w-full h-full">
            <p>KEYS</p>
          </div>
        </div>
        <div className="h-full bg-zinc-950 border-t-2 w-full">
          <div className="border-r-white border-r-2 h-full w-1/2">
            <p>ACTION</p>
          </div>
          <div className="w-full h-full">
            <p>ACTIONS</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientSettings
