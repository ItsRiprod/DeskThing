import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Loading from '../components/Loading'
import Dashboard from '@renderer/pages/Dashboard'
import Clients from '@renderer/pages/Clients'
import Apps from '@renderer/pages/Apps'
import Downloads from '@renderer/pages/Downloads'
import Dev from '@renderer/pages/Dev'
import Settings from '@renderer/pages/Settings'
import TopBar from './TopBar'
import ClientSettings from '@renderer/pages/Clients/Settings'
import AppsList from '@renderer/pages/Apps/AppsList'
import PageDataListener from '@renderer/listeners/PageDataListener'
import AppDownloads from '@renderer/pages/Downloads/AppDownloads'
import ClientDownloads from '@renderer/pages/Downloads/ClientDownloads'
import Logs from '@renderer/pages/Dev/Logs'
import ClientConnections from '@renderer/pages/Clients/Connections'

const AppRouter = (): JSX.Element => {
  return (
    <Router>
      <PageDataListener />
      <div className="flex flex-col h-full">
        <TopBar />
        <Routes>
          <Route path="/" element={<Loading />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />}>
            <Route path="settings" element={<ClientSettings />} />
            <Route path="connections" element={<ClientConnections />} />
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
            <Route path="app" element={<Loading />} />
            <Route path="adb" element={<Loading />} />
          </Route>
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default AppRouter
