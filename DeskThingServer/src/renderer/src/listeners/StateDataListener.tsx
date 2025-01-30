import { useEffect } from 'react'
import { usePageStore } from '@renderer/stores/index.ts'

const StateDataListener = (): null => {
  const { setPage } = usePageStore()

  useEffect(() => {
    window.electron.ipcRenderer.on('page-change', async (_event, newPage) => {
      setPage(newPage)
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('page-change')
    }
  }, [setPage])

  return null
}

export default StateDataListener
