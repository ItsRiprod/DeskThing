import { useEffect } from 'react'
import { usePageStore } from '../stores'
import { useNavigate } from 'react-router-dom'

/**
 * A React component that listens for changes to the current page in the application state and navigates to the updated page.
 *
 * This component is responsible for ensuring that the application's UI is in sync with the current page stored in the application state. Whenever the `currentPage` value in the `usePageStore` changes, this component will trigger a navigation to the new page.
 *
 * This component does not render any UI elements itself, but rather acts as a side-effect hook that listens for changes and updates the application's navigation accordingly.
 */
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
