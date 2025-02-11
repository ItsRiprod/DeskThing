import { IconArrowRight } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import useFeedbackStore from '@renderer/stores/feedbackStore'
import { FeedbackReport, FeedbackType } from '@shared/types'
import { FC, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const FeedbackOverlay: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const submitFeedback = useFeedbackStore((state) => state.submitFeedback)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feedback, setFeedback] = useState<Partial<any>>({
    type: 'bug',
    feedback: {
      title: '',
      feedback: '',
      reproduce: [],
      expected: '',
      actual: '',
      discordId: ''
    }
  })

  const onClose = (): void => {
    searchParams.delete('feedback')
    setSearchParams(searchParams)
  }

  const handleSubmit = (): void => {
    if (feedback.feedback?.title && feedback.feedback?.feedback) {
      submitFeedback(feedback)
      onClose()
    }
  }

  const handleChange = (field: string, value: string): void => {
    setFeedback(
      (prev) =>
        ({
          ...prev,
          feedback: {
            ...prev.feedback,
            [field]: value
          }
        }) as Partial<FeedbackReport>
    )
  }

  const handleTypeChange = (type: FeedbackType): void => {
    setFeedbackType(type)
    setFeedback((prev) => ({
      ...prev,
      type,
      feedback: {
        title: '',
        feedback: '',
        discordId: prev.feedback?.discordId || ''
      }
    }))
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg w-[600px]">
        <h2 className="text-xl font-semibold text-white">Submit Feedback</h2>

        <div className="flex gap-2 mb-4">
          {(['bug', 'feature', 'question', 'other'] as FeedbackType[]).map((type) => (
            <Button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`capitalize ${feedbackType === type ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Title</label>
          <input
            type="text"
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter feedback title"
            value={feedback.feedback?.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Discord ID (optional)</label>
          <input
            type="text"
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter your Discord ID"
            value={feedback.feedback?.discordId}
            onChange={(e) => handleChange('discordId', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Feedback</label>
          <textarea
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="Enter your feedback"
            value={feedback.feedback?.feedback}
            onChange={(e) => handleChange('feedback', e.target.value)}
          />
        </div>

        {(feedbackType === 'bug' || feedbackType === 'other') && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Steps to Reproduce</label>
              <div className="flex flex-col gap-2">
                {(feedback.feedback?.reproduce || []).map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                      placeholder={`Step ${index + 1}`}
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...(feedback.feedback?.reproduce || [])]
                        newSteps[index] = e.target.value
                        handleChange('reproduce', newSteps as unknown as string)
                      }}
                    />
                    <button
                      className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700"
                      onClick={() => {
                        const newSteps = [...(feedback.feedback?.reproduce || [])]
                        newSteps.splice(index, 1)
                        handleChange('reproduce', newSteps as unknown as string)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700"
                  onClick={() => {
                    const newSteps = [...(feedback.feedback?.reproduce || []), '']
                    handleChange('reproduce', newSteps as unknown as string)
                  }}
                >
                  + Add Step
                </button>
              </div>
            </div>{' '}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Expected Behavior</label>
              <input
                type="text"
                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                placeholder="What should happen?"
                value={feedback.feedback?.expected}
                onChange={(e) => handleChange('expected', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Actual Behavior</label>
              <input
                type="text"
                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                placeholder="What actually happens?"
                value={feedback.feedback?.actual}
                onChange={(e) => handleChange('actual', e.target.value)}
              />
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button
            title="Submit Feedback"
            onClick={handleSubmit}
            className="hover:bg-zinc-800"
            disabled={!feedback.feedback?.title || !feedback.feedback?.feedback}
          >
            Submit Feedback
            <IconArrowRight />
          </Button>
        </div>
      </div>
    </Overlay>
  )
}

export default FeedbackOverlay
