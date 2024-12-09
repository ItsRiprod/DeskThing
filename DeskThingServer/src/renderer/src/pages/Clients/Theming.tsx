import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import { IconPlus } from '@renderer/assets/icons'
import MainElement from '@renderer/nav/MainElement'

const ClientTheming: React.FC = () => {
  const [disabled, _setDisabled] = useState(true)

  return (
    <div className="flex h-full w-full">
      <Sidebar>
        <div className="w-full justify-between h-full flex-col flex">
          <div className="w-full gap-2 flex flex-col">
            <p className="w-full text-center border-b-2">Profiles</p>
            <Button className="border border-gray-500 justify-center hover:bg-gray-600">
              Default
            </Button>
          </div>
          <Button className="border-gray-500 justify-center hover:bg-gray-600">
            <IconPlus iconSize={24} />
          </Button>
        </div>

        <div className="w-full justify-between h-full flex-col flex">
          <div className="w-full gap-2 flex flex-col">
            <p className="w-full text-center border-b-2">Actions</p>
            <Button className="border border-gray-500 hover:bg-gray-600 justify-center">
              Server
            </Button>
          </div>
          <Button className=" border-gray-500 justify-center hover:bg-gray-600">
            <IconPlus iconSize={24} />
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="w-full h-full flex">
          <div className="w-full h-full grid grid-rows-3 grid-cols-3">
            <div className="p-4 w-full h-full col-span-1 row-span-2">
              <div className="border-gray-500 border-r w-full h-full"></div>
            </div>
            <div className="w-full h-full col-span-2 row-span-2"></div>
            <div className="border-gray-500 border-t w-full h-full col-span-1"></div>
            <div className="border-gray-500 border-t w-full h-full col-span-2"></div>
          </div>
        </div>
      </MainElement>
      {disabled && (
        <div className="w-screen h-full absolute bg-black/60 flex items-center justify-center">
          <p className="font-semibold text-4xl">Development Is In Progress</p>
        </div>
      )}
    </div>
  )
}

export default ClientTheming
