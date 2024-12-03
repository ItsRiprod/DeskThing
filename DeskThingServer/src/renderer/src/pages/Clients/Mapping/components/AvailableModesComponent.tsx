import Button from '@renderer/components/Button'
import { useClientStore } from '@renderer/stores'
import { EventMode } from '@shared/types'

interface AvailableModesProps {
  modes: EventMode[]
  setSelectedMode: (mode: EventMode) => void
  currentMode: EventMode
}

const AvailableModes: React.FC<AvailableModesProps> = ({
  currentMode,
  modes,
  setSelectedMode
}: AvailableModesProps) => {
  const handleModeClick = (mode: EventMode): void => {
    setSelectedMode(mode)
  }
  const clientManifest = useClientStore((state) => state.clientManifest)

  return (
    <div className="w-full overflow-y-auto border-b border-gray-700 p-3 flex-shrink-0 items-center justify-between flex gap-3">
      <div className="items-center flex gap-3">
        <p>Modes: </p>
        {modes.map((mode, index) => (
          <Button
            onClick={() => handleModeClick(mode)}
            key={index}
            className={`${currentMode == mode && 'bg-zinc-900'}`}
          >
            <p>{EventMode[mode]}</p>
          </Button>
        ))}
      </div>
      {!clientManifest && (
        <div className="flex items-center justify-center">
          <p className="text-gray-500 italic">
            No client installed. <span className="md:inline hidden">Icons may not render</span>
          </p>
        </div>
      )}
    </div>
  )
}
export default AvailableModes
