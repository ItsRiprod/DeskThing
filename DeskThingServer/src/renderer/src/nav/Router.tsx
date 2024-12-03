import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Loading from '../components/Loading'
import Clients from '@renderer/pages/Clients'
import Apps from '@renderer/pages/Apps'
import Downloads from '@renderer/pages/Downloads'
import Dev from '@renderer/pages/Dev'
import TopBar from './TopBar'
import ClientMappingPage from '@renderer/pages/Clients/Mapping/'
import AppsList from '@renderer/pages/Apps/AppsList'
import PageDataListener from '@renderer/listeners/PageDataListener'
import AppDownloads from '@renderer/pages/Downloads/AppDownloads'
import ClientDownloads from '@renderer/pages/Downloads/ClientDownloads'
import Logs from '@renderer/pages/Dev/Logs'
import ClientConnections from '@renderer/pages/Clients/Connections'
import OverlayWrapper from '@renderer/overlays/OverlaysWrapper'
import ServerRoutingListener from '@renderer/listeners/ServerRouteListener'
import WelcomeWidget from '@renderer/pages/Dashboard/WelcomeWidget'
import DevApp from '@renderer/pages/Dev/DevApp'
import ADBSettings from '@renderer/pages/Dev/ADBSettings'
import ClientTheming from '@renderer/pages/Clients/Theming'
import ProfilesPage from '@renderer/pages/Clients/profiles'

const AppRouter = (): JSX.Element => {
  return (
    <Router>
      <OverlayWrapper>
        <PageDataListener />
        <ServerRoutingListener />
        <div className="flex flex-col h-full">
          <TopBar />
          <Routes>
            <Route path="/" element={<Loading />} />
            <Route path="/da" element={<Navigate to="/dashboard" replace />} />
            <Route path="/do" element={<Navigate to="/downloads/client" replace />} />
            <Route path="/de" element={<Navigate to="/developer/logs" replace />} />
            <Route path="/cl" element={<Navigate to="/clients/connections" replace />} />
            <Route path="/ap" element={<Navigate to="/apps/list" replace />} />

            <Route path="/dashboard" element={<WelcomeWidget />} />
            <Route path="/clients" element={<Clients />}>
              <Route path="mapping" element={<ClientMappingPage />} />
              <Route path="theming" element={<ClientTheming />} />
              <Route path="connections" element={<ClientConnections />} />
              <Route path="Profiles" element={<ProfilesPage />} />
            </Route>
            <Route path="/apps" element={<Apps />}>
              <Route path="list" element={<AppsList />} />
            </Route>
            <Route path="/downloads" element={<Downloads />}>
              <Route path="app" element={<AppDownloads />} />
              <Route path="client" element={<ClientDownloads />} />
            </Route>
            <Route path="/developer" element={<Dev />}>
              <Route path="logs" element={<Logs />} />
              <Route path="app" element={<DevApp />} />
              <Route path="adb" element={<ADBSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </OverlayWrapper>
    </Router>
  )
}

export default AppRouter
