import { IconArrowRight, IconRefresh } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import useFeedbackStore from '@renderer/stores/feedbackStore'
import { FeedbackReport, FeedbackType } from '@shared/types'
import { FC, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const FeedbackOverlay: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const submitFeedback = useFeedbackStore((state) => state.submitFeedback)
  const addSystemInfo = useFeedbackStore((state) => state.addSystemData)
  const fetchSystemInfo = useFeedbackStore((state) => state.fetchSystemInfo)
  const rawFeedback = useFeedbackStore((state) => state.feedback)
  const systemInfo = useFeedbackStore((state) => state.systemData)

  const [feedback, setFeedback] = useState<Partial<FeedbackReport>>(
    rawFeedback || {
      type: 'bug',
      feedback: {
        title: '',
        feedback: '',
        reproduce: [],
        expected: '',
        actual: '',
        discordId: ''
      }
    }
  )

  const onClose = (): void => {
    searchParams.delete('feedback')
    setSearchParams(searchParams)
  }

  const handleSubmit = (): void => {
    if (feedback.feedback?.title && feedback.feedback?.feedback) {
      submitFeedback({
        ...feedback,
        feedback: {
          ...feedback.feedback,
          ...systemInfo
        }
      })
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

  const handleSystemInfoChange = (field: string, value: string): void => {
    addSystemInfo({ [field]: value })
  }

  return (
    <Overlay showFeedbackButton={false} onClose={onClose} className="max-h-[80vh] overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg w-[600px]">
        <h2 className="text-xl font-semibold text-white">Submit Feedback</h2>

        <div className="flex gap-2 mb-4">
          {(['bug', 'feature', 'question', 'other'] as FeedbackType[]).map((type) => (
            <Button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`capitalize ${feedback.type === type ? 'bg-blue-600' : 'bg-zinc-800'}`}
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

        {(feedback.type === 'bug' || feedback.type === 'other') && (
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

        <div className="flex flex-col gap-2">
          <details className="text-white">
            <summary className="cursor-pointer p-2 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700">
              System Information
            </summary>
            <div className="relative mt-2 p-4 rounded bg-zinc-800 border border-zinc-700">
              <div className="absolute top-3 right-3">
                <Button className="gap-2 hover:bg-cyan-400 bg-cyan-500" onClick={fetchSystemInfo}>
                  <IconRefresh />
                  <p>Fetch Info</p>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400">Server Version</p>
                  <p>{systemInfo?.serverVersion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Client Version</p>
                  <p>{systemInfo?.clientVersion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Operating System</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.os || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('os', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">CPU</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.cpu || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('cpu', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Current Page</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.page || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('page', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Uptime</p>
                  <p>{systemInfo?.uptime ? systemInfo.uptime : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">RAM</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.ram || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('ram', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Free RAM</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.freeRam || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('freeRam', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Architecture</p>
                  <input
                    type="text"
                    className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    value={systemInfo?.arch || 'N/A'}
                    onChange={(e) => handleSystemInfoChange('arch', e.target.value)}
                  />
                </div>{' '}
                <div>
                  <p className="text-sm text-zinc-400">Load Average</p>
                  <p>{systemInfo?.loadAverage ? systemInfo.loadAverage.join(', ') : 'N/A'}</p>
                </div>
              </div>
              {systemInfo?.apps && systemInfo?.apps.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-400 mb-2">Running Apps</p>
                  <div className="grid grid-cols-1 gap-2">
                    {systemInfo.apps.map((app, index) => (
                      <div key={index} className="p-2 rounded bg-zinc-700">
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-zinc-400">Version: {app.version}</p>
                        <p className="text-sm text-zinc-400">
                          Status: {app.running ? 'Running' : 'Stopped'} (
                          {app.enabled ? 'Enabled' : 'Disabled'})
                        </p>
                        <p className="text-sm text-zinc-400">Running for: {app.runningDuration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {systemInfo?.clients && systemInfo.clients.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-400 mb-2">Connected Clients</p>
                  <div className="grid grid-cols-1 gap-2">
                    {systemInfo.clients.map((client, index) => (
                      <div key={index} className="p-2 rounded bg-zinc-700">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-zinc-400">
                          Connection Type: {client.connectionType}
                        </p>
                        <p className="text-sm text-zinc-400">Device Type: {client.deviceType}</p>
                        <p className="text-sm text-zinc-400">
                          Connected for: {client.connectionDuration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="flex justify-end">
          <Button
            title={
              !feedback.feedback?.title || !feedback.feedback?.feedback
                ? 'Fill out Feedback'
                : 'Submit Feedback'
            }
            onClick={handleSubmit}
            className="hover:bg-zinc-800 disabled:hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
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
