import React from 'react'
import { AppSettingProps } from './AppsOverlay'

const AppDetails: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  if (!app.manifest) return null

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Is Audio Source:</p>
            <p>{app.manifest.isAudioSource ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="font-semibold">Requires:</p>
            <ul className="list-disc list-inside">
              {app.manifest.requires.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Description:</p>
            <p>{app.manifest.description || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Author:</p>
            <p>{app.manifest.author || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">ID:</p>
            <p>{app.manifest.id}</p>
          </div>
          <div>
            <p className="font-semibold">Is Web App:</p>
            <p>{app.manifest.isWebApp ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="font-semibold">Is Screen Saver:</p>
            <p>{app.manifest.isScreenSaver ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="font-semibold">Is Local App:</p>
            <p>{app.manifest.isLocalApp ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="font-semibold">Platforms:</p>
            <ul className="list-disc list-inside">
              {app.manifest.platforms.map((platform, index) => (
                <li key={index}>{platform}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Homepage:</p>
            {app.manifest.homepage && (
              <a href={app.manifest.homepage} target="_blank" rel="noreferrer noopener">
                {app.manifest.homepage || 'N/A'}
              </a>
            )}
          </div>
          <div>
            <p className="font-semibold">Repository:</p>
            {app.manifest.repository && (
              <a href={app.manifest.repository} target="_blank" rel="noreferrer noopener">
                {app.manifest.repository || 'N/A'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppDetails
