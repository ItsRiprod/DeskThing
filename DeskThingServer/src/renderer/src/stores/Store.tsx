import ClientDataListener from '../listeners/ClientDataListener.tsx'
import AppStoreDataListener from '../listeners/AppStoreDataListener.tsx'
import LogDataListener from '@renderer/listeners/LogDataListener.tsx'
import RequestDataListener from '@renderer/listeners/RequestDataListener.tsx'
import SettingsDataListener from '@renderer/listeners/SettingsDataListener.tsx'
import MappingsDataListener from '@renderer/listeners/mappingsDataListener.tsx'
import GithubDataListener from '@renderer/listeners/GithubDataListener.tsx'

export default function Store({ children }) {
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
