import React from 'react'
import { AppSettingProps } from './AppsOverlay'

const AppDetails: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  if (!app.manifest) return null

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full bg-black shadow-2xl rounded-2xl p-5">
        <div className="">
          <AppDetail title="Requires" value={app.manifest.requires.join(', ')}>
            <div className="flex flex-col gap-2">
              {app.manifest.requires.map((required, index) => (
                <div key={index} className="flex items-center gap-2">
                  <p>{required}</p>
                </div>
              ))}
            </div>
          </AppDetail>
          <AppDetail title="Description" value={app.manifest.description} />
          <AppDetail title="Version" value={app.manifest.version} />
          <AppDetail title="Author" value={app.manifest.author} />
          <AppDetail title="ID" value={app.manifest.id} />
          <AppDetail title="Webapp" value={app.manifest.isWebApp ? 'Yes' : 'No'} />
          <AppDetail title="Screensaver" value={app.manifest.isScreenSaver ? 'Yes' : 'No'} />
          <AppDetail title="Local App" value={app.manifest.isLocalApp ? 'Yes' : 'No'} />
          <AppDetail title="Is Audio Source" value={app.manifest.isAudioSource ? 'Yes' : 'No'} />
          <AppDetail title="Supported Platforms" value={app.manifest.platforms.join(', ')}>
            <div className="flex flex-col gap-2">
              {app.manifest.platforms.map((platform, index) => (
                <div key={index} className="flex items-center gap-2">
                  <p>{platform}</p>
                </div>
              ))}
            </div>
          </AppDetail>
          <AppDetail title="Homepage" value={app.manifest.homepage}>
            <a
              href={app.manifest.homepage}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400"
            >
              {app.manifest.homepage}
            </a>
          </AppDetail>
          <AppDetail title="Repository" value={app.manifest.repository}>
            <a
              href={app.manifest.repository}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400"
            >
              {app.manifest.repository}
            </a>
          </AppDetail>
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
