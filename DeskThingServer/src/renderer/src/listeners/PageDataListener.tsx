import { useEffect } from 'react'
import { usePageStore } from '../stores'
import { useNavigate } from 'react-router-dom'

const PageDataListener = (): null => {
  const currentPage = usePageStore((state) => state.currentPage)
  const navigator = useNavigate()

  useEffect(() => {
    const handlePageChange = async (): Promise<void> => {
      navigator(currentPage)
    }

    handlePageChange()
  }, [currentPage])

  return null
}

export default PageDataListener
