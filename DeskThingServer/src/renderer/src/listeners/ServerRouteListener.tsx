import { usePageStore } from '@renderer/stores'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const ServerRoutingListener = (): null => {
  const setPage = usePageStore((state) => state.setPage)
  const [_searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const handleServerRouting = async (_event: Electron.Event, url: string): Promise<void> => {
      console.log('ServerRoutingListener', url)
      const [path, query] = url.split('?')
      setPage(path)

      if (query) {
        const newParams = new URLSearchParams(query)
        setSearchParams(newParams)
      }
    }
    window.electron.ipcRenderer.on('handle-protocol-url', handleServerRouting)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('handle-protocol-url')
    }
  }, [setSearchParams])

  return null
}

export default ServerRoutingListener
