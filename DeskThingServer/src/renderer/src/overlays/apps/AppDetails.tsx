import React from 'react'
import { AppSettingProps } from './AppsOverlay'
import { AppIcon } from '@renderer/components/AppIcon'

const AppDetails: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  if (!app.manifest) return null

  console.log(app.manifest.tags)

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full bg-black shadow-2xl rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <AppIcon appId={app.manifest.id} className="text-white !w-16 !h-16" />
          <h2 className="text-xl font-bold text-white">{app.manifest.label}</h2>
        </div>
        <div className="space-y-2">
          <AppDetail title="Description" value={app.manifest.description} />
          <AppDetail title="Version" value={app.manifest.version} />
          <AppDetail title="Version Code" value={app.manifest.version_code?.toString()} />
          <AppDetail title="Author" value={app.manifest.author} />
          <AppDetail title="ID" value={app.manifest.id} />
          <AppDetail title="Label" value={app.manifest.label} />
          <AppDetail title="Template" value={app.manifest.template} />

          <AppDetail title="Requires" value={app.manifest.requires?.join(', ')}>
            <div className="grid grid-cols-2 gap-2">
              {app.manifest.requires?.map((required, index) => (
                <div key={index} className="px-2 py-1 bg-zinc-900 rounded">
                  {required}
                </div>
              ))}
            </div>
          </AppDetail>

          <AppDetail title="Supported Platforms" value={app.manifest.platforms?.join(', ')}>
            <div className="grid grid-cols-2 gap-2">
              {app.manifest.platforms?.map((platform, index) => (
                <div key={index} className="px-2 py-1 bg-zinc-900 rounded">
                  {platform}
                </div>
              ))}
            </div>
          </AppDetail>

          <AppDetail title="Tags" value={app.manifest.tags?.join(', ')}>
            <div className="flex flex-wrap gap-2">
              {app.manifest.tags?.map((tag, index) => (
                <div key={index} className="px-2 py-1 bg-zinc-900 rounded">
                  {tag}
                </div>
              ))}
            </div>
          </AppDetail>

          <AppDetail title="Homepage" value={app.manifest.homepage}>
            <a
              href={app.manifest.homepage}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400 underline"
            >
              {app.manifest.homepage}
            </a>
          </AppDetail>

          <AppDetail title="Repository" value={app.manifest.repository}>
            <a
              href={app.manifest.repository}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400 underline"
            >
              {app.manifest.repository}
            </a>
          </AppDetail>

          <AppDetail title="Update URL" value={app.manifest.updateUrl}>
            <a
              href={app.manifest.updateUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:text-blue-400 underline"
            >
              {app.manifest.updateUrl}
            </a>
          </AppDetail>

          <AppDetail
            title="Required Server Version"
            value={app.manifest.requiredVersions?.server}
          />
          <AppDetail
            title="Required Client Version"
            value={app.manifest.requiredVersions?.client}
          />
          <AppDetail
            title="Compatible Server"
            value={
              Array.isArray(app.manifest.compatible_server)
                ? app.manifest.compatible_server.join(', ')
                : app.manifest.compatible_server
            }
          />
          <AppDetail
            title="Compatible Client"
            value={
              Array.isArray(app.manifest.compatible_server)
                ? app.manifest.compatible_server.join(', ')
                : app.manifest.compatible_server
            }
          />

          <AppDetail title="App Type">
            <div className="grid grid-cols-2 gap-2">
              {app.manifest.isWebApp && (
                <div className="px-2 py-1 bg-zinc-900 rounded">Web App</div>
              )}
              {app.manifest.isScreenSaver && (
                <div className="px-2 py-1 bg-zinc-900 rounded">Screensaver</div>
              )}
              {app.manifest.isLocalApp && (
                <div className="px-2 py-1 bg-zinc-900 rounded">Local App</div>
              )}
              {app.manifest.isAudioSource && (
                <div className="px-2 py-1 bg-zinc-900 rounded">Audio Source</div>
              )}
            </div>
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
  if (!value && !children) return null

  return (
    <div className="flex flex-col gap-2 p-3 hover:bg-zinc-900 rounded-lg border border-zinc-800">
      <h4 className="font-semibold text-zinc-400">{title}</h4>
      <div className="text-white">{children || <p>{value}</p>}</div>
    </div>
  )
}

export default AppDetails
