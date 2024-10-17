import React from 'react'
import { usePageStore } from '../stores/'

const Papertrail: React.FC = () => {
  const currentPage = usePageStore((pageStore) => pageStore.currentPage)

  const renderPapertrail = (): React.ReactNode => {
    const trail = currentPage.split('/').filter(Boolean)

    return trail.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span>{' >'} </span>}
        <span>{item}</span>
      </React.Fragment>
    ))
  }

  return (
    <div className="w-full bg-zinc-900 p-1 font-geistMono text-gray-500">{renderPapertrail()}</div>
  )
}

export default Papertrail
