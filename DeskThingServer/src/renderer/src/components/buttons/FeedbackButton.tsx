import { IconFeedback } from '@renderer/assets/icons'
import Button from './Button'
import { FC } from 'react'
import { useSearchParams } from 'react-router-dom'
import useFeedbackStore from '@renderer/stores/feedbackStore'
import { usePageStore } from '@renderer/stores'

type FeedbackButtonProps = {
  showText?: boolean
  className?: string
  onClick?: () => void
}

export const FeedbackButton: FC<FeedbackButtonProps> = ({
  showText = true,
  className,
  onClick
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = usePageStore((page) => page.currentPage)
  const addSystemData = useFeedbackStore((store) => store.addSystemData)

  const handleOpenFeedback = (): void => {
    onClick?.()
    addSystemData({ page: currentPage + '?' + searchParams.get('page') })
    setTimeout(() => {
      searchParams.set('feedback', 'true')
      setSearchParams({ feedback: 'true' })
    }, 210)
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
