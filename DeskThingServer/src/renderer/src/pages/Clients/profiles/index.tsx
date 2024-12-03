import React from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import { IconDownload, IconPlus, IconUpload } from '@renderer/assets/icons'
import MainElement from '@renderer/nav/MainElement'
import SponsorButton from '@renderer/components/SponsorButton'

const ProfilesPage: React.FC = () => {
  return (
    <div className="flex h-full w-full">
      <Sidebar className=" justify-between ">
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

        <div className="w-full justify-between flex-col flex">
          <Button className=" border-gray-500  gap-2 justify-center hover:bg-gray-600">
            <IconUpload iconSize={24} />
            <p className="hidden md:block">Export</p>
          </Button>
          <Button className=" border-gray-500 gap-2 justify-center hover:bg-gray-600">
            <IconDownload iconSize={24} />
            <p className="hidden md:block">Import</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="w-full h-full flex">
          <div className="w-full h-full grid grid-rows-3 grid-cols-3">
            <div className="p-4 w-full h-full col-span-1 row-span-2">
              <div className="border-gray-500 border-r w-full h-full"></div>
            </div>
            <div className="w-full flex-col flex items-center justify-center h-full col-span-2 row-span-2">
              <p>Profiles will be added in a later version</p>
              <p>While you are here, consider helping support deskthing!</p>
              <SponsorButton />
              <p>A little coffee can go a long way</p>
            </div>
            <div className="border-gray-500 border-t w-full h-full col-span-1"></div>
            <div className="border-gray-500 border-t w-full h-full col-span-2"></div>
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default ProfilesPage
