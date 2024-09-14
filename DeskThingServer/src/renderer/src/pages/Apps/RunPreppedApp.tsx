import React from 'react'
import { useReward } from 'react-rewards'

interface AppData {
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
  appId: string
}

interface RunPreppedAppProps {
  appData: AppData
  handleAddAndRunApp: () => void
}

const RunPreppedApp: React.FC<RunPreppedAppProps> = ({ appData, handleAddAndRunApp }) => {
  const confettiConfig = {
    startVelocity: 7,
    elementCount: 14,
    decay: 0.98,
    lifetime: 50,
    onAnimationComplete: handleAddAndRunApp
  }
  const { reward } = useReward('runAppId', 'confetti', confettiConfig)

  return (
    <div className="border-2 border-zinc-200 p-5 w-52 md:w-11/12 2xl:w-96 h-fit flex-col justify-between rounded-3xl shadow-lg px-5 items-center">
      <p className="text-xl pb-4">{appData.appName} is Ready!</p>
      <div className="flex gap-5">
        <p className="text-sm pb-4">{appData.appVersion}</p>
        <p className="text-sm pb-4">Author: {appData.author || 'not provided'}</p>
      </div>
      <p className="text-sm pb-4">Compatible With: {appData.platforms.join(', ')}</p>
      {appData.requirements.length > 0 && (
        <p className="text-sm pb-4">Required Apps: {appData.requirements.join(', ')}</p>
      )}
      <button
        onClick={reward}
        className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
      >
        <span id="runAppId" />
        Run {appData.appId}
      </button>
    </div>
  )
}

export default RunPreppedApp
