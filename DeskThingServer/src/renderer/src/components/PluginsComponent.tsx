import { PluginApplications, PluginManifest } from '@deskthing/types'
import usePluginStore from '@renderer/stores/pluginStore'
import { PluginPayload } from '@shared/types'
import { useEffect, useState } from 'react'
import Button from '@renderer/components/buttons/Button'

const badgeColor = (app?: PluginApplications): string => {
  switch (app) {
    case PluginApplications.SERVER:
      return 'bg-blue-800 text-white'
    case PluginApplications.CLIENT:
      return 'bg-green-800 text-white'
    case PluginApplications.ADB:
      return 'bg-yellow-600 text-zinc-900'
    case PluginApplications.BLUETOOTH:
      return 'bg-purple-800 text-white'
    default:
      return 'bg-zinc-700 text-white'
  }
}

const PluginComponent = ({
  plugin,
  application,
  metadata
}: {
  plugin: PluginManifest
  application: PluginApplications
  metadata: PluginPayload<PluginApplications>
}): JSX.Element => {
  const installPlugin = usePluginStore((state) => state.installPlugin)
  const uninstallPlugin = usePluginStore((state) => state.uninstallPlugin)
  const [processing, setProcessing] = useState(false)

  const types = Object.keys(plugin.entrypoints || {}) as PluginApplications[]
  const primaryType = types[0] // show first supported type as label

  const onInstall = async (): Promise<void> => {
    try {
      setProcessing(true)
      await installPlugin(plugin.id, application, metadata)
    } finally {
      setProcessing(false)
    }
  }

  const onUninstall = async (): Promise<void> => {
    try {
      setProcessing(true)
      await uninstallPlugin(plugin.id, application, metadata)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 rounded text-sm font-medium ${badgeColor(primaryType)}`}>
            {primaryType ? primaryType.toUpperCase() : 'UNKNOWN'}
          </div>
          <h3 className="text-lg font-semibold text-zinc-200">{plugin.label}</h3>
          <span className="ml-2 text-xs text-zinc-500">v{plugin.version}</span>
        </div>

        <p className="mt-2 text-sm text-zinc-400">{plugin.description}</p>
        {plugin.purpose && <p className="mt-1 text-xs text-zinc-500">Purpose: {plugin.purpose}</p>}

        {types.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {types.map((t) => (
              <span
                key={t}
                className={`text-xs px-2 py-0.5 rounded ${badgeColor(t)} bg-opacity-90`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-0 sm:ml-4 flex gap-2">
        <Button
          onClick={onInstall}
          disabled={processing}
          className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-2 text-sm"
        >
          Install
        </Button>
        <Button
          onClick={onUninstall}
          disabled={processing}
          className="bg-zinc-900 hover:bg-zinc-800 border-red-500/30 border min-w-fit transition-colors duration-200 gap-2 rounded-lg p-2 text-sm"
        >
          Uninstall
        </Button>
      </div>
    </div>
  )
}

export const PluginsComponent = ({
  application,
  metadata
}: {
  application: PluginApplications
  metadata: PluginPayload<PluginApplications>
}): JSX.Element => {
  const getPlugins = usePluginStore((state) => state.getPluginByApp) || []
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async (): Promise<void> => {
      setIsLoading(true)
      try {
        let plugins: PluginManifest[] = []
        const res = getPlugins(application)
        plugins = await Promise.resolve(res)
        if (mounted) setAvailablePlugins(plugins || [])
      } catch {
        if (mounted) setAvailablePlugins([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [application, getPlugins])

  return (
    <div className="space-y-4">
      <div className="p-3 bg-zinc-900 border-l-4 border-zinc-800 text-sm text-zinc-400 rounded-lg">
        Disclaimer: Plugins are a beta feature and still in development. Use with caution.
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="h-4 w-48 bg-zinc-800 rounded mb-2"></div>
                <div className="h-3 w-80 bg-zinc-800 rounded"></div>
              </div>
              <div className="ml-4">
                <div className="h-8 w-24 bg-zinc-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : availablePlugins.length === 0 ? (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-zinc-500">
          No plugins available for this application.
        </div>
      ) : (
        <div className="grid gap-3">
          {availablePlugins.map((p: PluginManifest) => (
            <PluginComponent key={p.id} plugin={p} application={application} metadata={metadata} />
          ))}
        </div>
      )}
    </div>
  )
}
