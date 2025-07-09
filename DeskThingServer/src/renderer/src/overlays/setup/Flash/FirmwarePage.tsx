import { FC, useEffect } from 'react'
import { SuperbirdPageProps } from './SuperbirdPage'
import { ThingifyTools } from './ThingifyTools'
import useFlashStore from '@renderer/stores/flashStore'
import { FileSelection } from './FileSelection'

export const FirmwarePage: FC<SuperbirdPageProps> = ({ onComplete }) => {
  const staged = useFlashStore((state) => state.stagedFileName)
  const getCurrentStaged = useFlashStore((state) => state.getStagedFile)

  useEffect(() => {
    if (staged) onComplete(`Firmware Uploaded: ${staged}`)
    else getCurrentStaged()
  }, [getCurrentStaged, staged])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="border-b border-zinc-700 w-full pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-400 mb-2">Firmware Selection</h1>
        {staged && (
          <h1 className="text-sm text-neutral-400 bg-zinc-800 px-3 py-1 rounded-md">
            Staged File: {staged}
          </h1>
        )}
      </div>
      <div className="pb-6 border-b border-zinc-700">
        <FileSelection />
      </div>
      <div className="flex justify-center">
        <p className="text-neutral-300 text-xl font-medium my-2">OR</p>
      </div>
      <div className="pt-6 border-t border-zinc-700">
        <ThingifyTools />
      </div>
    </div>
  )
}
