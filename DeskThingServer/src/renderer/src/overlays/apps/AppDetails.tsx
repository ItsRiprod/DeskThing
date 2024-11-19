import React from 'react'
import { AppSettingProps } from './AppsOverlay'
import deskThingIcon from '../../../../../resources/icon2.png'
import { IconCheck, IconX } from '@renderer/assets/icons'

const AppDetails: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  if (!app.manifest) return null

  return (
    <div className="p-4 flex flex-col gap-4 w-full h-full justify-between">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <img
            src={app.manifest.iconUrl ?? deskThingIcon}
            alt="Icon"
            className="w-24 h-24 rounded-lg"
          />
          <div>
            <h2 className="text-3xl">{app.manifest.label}</h2>
            <p className="text-gray-400">{app.manifest.author}</p>
          </div>
        </div>
        <div>{app.manifest.description}</div>
      </div>

      <div className="flex flex-col gap-4">
        {app.manifest.homepage && (
          <div className="flex gap-2">
            <label>Home Page:</label>
            <a
              href={app.manifest.homepage}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400"
            >
              {app.manifest.homepage}
            </a>
          </div>
        )}
        {app.manifest.repository && (
          <div className="flex gap-2">
            <label>Repository:</label>
            <a
              href={app.manifest.repository}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400"
            >
              {app.manifest.repository}
            </a>
          </div>
        )}
        {app.manifest.platforms?.length > 0 && (
          <div className="flex gap-4">
            <label>Supported Platforms:</label>
            {app.manifest.platforms.map((platform, index) => (
              <p className="text-gray-400" key={index}>
                {platform}
              </p>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex gap-1">
            <label>Web Application</label>
            {app.manifest.isWebApp ? (
              <IconCheck className="w-6 h-6 text-green-500" />
            ) : (
              <IconX className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div className="flex gap-1">
            <label>Local Application</label>
            {app.manifest.isLocalApp ? (
              <IconCheck className="w-6 h-6 text-green-500" />
            ) : (
              <IconX className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div className="flex gap-1">
            <label>Screen Saver</label>
            {app.manifest.isScreenSaver ? (
              <IconCheck className="w-6 h-6 text-green-500" />
            ) : (
              <IconX className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div className="flex gap-1">
            <label>Audio Source</label>
            {app.manifest.isAudioSource ? (
              <IconCheck className="w-6 h-6 text-green-500" />
            ) : (
              <IconX className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-400">Version {app.manifest.version}</p>
          <p className="text-gray-400">ID: {app.manifest.id}</p>
        </div>
      </div>
    </div>
  )
}

interface AppDetailsInterface {
  value?: string
  title: string
  children?: React.ReactNode
}

const AppDetail: React.FC<AppDetailsInterface> = ({ value, title, children }) => {
  if (value) {
    return (
      <div className="flex justify-between items-center p-1 hover:bg-zinc-900 border-t border-zinc-950">
        <h4 className="font-semibold">{title}</h4>
        {children || <p>{value}</p>}
      </div>
    )
  } else {
    return null
  }
}

export default AppDetails
