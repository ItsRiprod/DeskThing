import { IconFeedback } from '@renderer/assets/icons'
import Button from './Button'
import { FC } from 'react'
import { useSearchParams } from 'react-router-dom'
import useFeedbackStore from '@renderer/stores/feedbackStore'
import { usePageStore } from '@renderer/stores'

type FeedbackButtonProps = {
  showText?: boolean
  className?: string
}

export const FeedbackButton: FC<FeedbackButtonProps> = ({ showText = true, className }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = usePageStore((page) => page.currentPage)
  const addSystemData = useFeedbackStore((store) => store.addSystemData)

  const handleOpenFeedback = (): void => {
    addSystemData({ page: currentPage + '?' + searchParams.get('page') })
    setSearchParams({ feedback: 'true' })
  }

  return (
    <Button
      title="Submit Feedback"
      onClick={handleOpenFeedback}
      className={`gap-2 ${className || ' hover:bg-zinc-900'}`}
    >
      <IconFeedback />
      {showText && <p className="flex-grow text-center text-lg md:block hidden">Feedback</p>}
    </Button>
  )
}

export default FeedbackButton
