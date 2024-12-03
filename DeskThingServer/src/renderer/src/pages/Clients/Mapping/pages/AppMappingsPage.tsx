import { useEffect, useState } from 'react'
import { PageProps } from '..'
import AvailableModes from '../components/AvailableModesComponent'
import { Key, EventMode } from '@shared/types'
import AvailableKeys from '../components/AvailableKeysComponent'
import useMappingStore from '@renderer/stores/mappingStore'

const AppMappingsPage: React.FC<PageProps> = ({
  onMappingChange,
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode
}: PageProps) => {
  return (
    <div className="h-full flex flex-col w-full">
      <p>App Mappings</p>
    </div>
  )
}

export default AppMappingsPage
