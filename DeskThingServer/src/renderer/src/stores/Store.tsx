import React from 'react'
import ClientDataListener from '../listeners/ClientDataListener'
import AppStoreDataListener from '../listeners/AppStoreDataListener'
import LogDataListener from '@renderer/listeners/LogDataListener'
import RequestDataListener from '@renderer/listeners/RequestDataListener'
import SettingsDataListener from '@renderer/listeners/SettingsDataListener'
import MappingsDataListener from '@renderer/listeners/mappingsDataListener'
import GithubDataListener from '@renderer/listeners/GithubDataListener'

const Store: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <ClientDataListener />
      <AppStoreDataListener />
      <LogDataListener />
      <MappingsDataListener />
      <RequestDataListener />
      <SettingsDataListener />
      <GithubDataListener />
      {children}
    </>
  )
}

export default Store
