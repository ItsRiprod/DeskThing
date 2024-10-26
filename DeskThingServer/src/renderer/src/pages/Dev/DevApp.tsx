import React from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import Loading from '@renderer/components/Loading'

const DevApp: React.FC = () => {
  return (
    <div className="w-full h-full flex">
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch items-center">
        <p>
          ERR: <span className="hidden md:inline">Unimplemented</span>
        </p>
      </Sidebar>
      <MainElement>
        <Loading message="Developer Apps Are Not Implemented In This Version" />
      </MainElement>
    </div>
  )
}

export default DevApp
