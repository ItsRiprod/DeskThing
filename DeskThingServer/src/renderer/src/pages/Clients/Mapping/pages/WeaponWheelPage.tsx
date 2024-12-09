import { PageProps } from '..'
import useMappingStore from '@renderer/stores/mappingStore'
import { ActionReference } from '@shared/types'
import { ActionIcon } from '../components/ActionIcon'
import Button from '@renderer/components/Button'
import { IconCarThing } from '@renderer/assets/icons'

const WheelPage: React.FC<PageProps> = ({
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode
}: PageProps) => {
  const getKeyById = useMappingStore((state) => state.getKeyById)
  const handleKeyClick = async (keyId: string): Promise<void> => {
    const key = await getKeyById(keyId)
    if (key) {
      setSelectedKey(key)
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <div className="absolute w-screen h-screen border flex items-center justify-center">
        <IconCarThing className="w-fit -translate-x-[35%] translate-y-[6%] h-full" />
      </div>
      <div className="relative h-1/2 min-h-1/2 flex items-center justify-center aspect-square">
        <WheelButton
          keyId="Wheel1"
          onKeyClick={handleKeyClick}
          selectedKeyId={selectedKey?.id}
          className="-left-20 absolute"
          action={currentMapping.mapping['Wheel1'][mode]}
        />
        <WheelButton
          keyId="Wheel2"
          onKeyClick={handleKeyClick}
          selectedKeyId={selectedKey?.id}
          className="-top-20 absolute"
          action={currentMapping.mapping['Wheel2'][mode]}
        />
        <WheelButton
          keyId="Wheel3"
          onKeyClick={handleKeyClick}
          selectedKeyId={selectedKey?.id}
          className="-right-20 absolute"
          action={currentMapping.mapping['Wheel3'][mode]}
        />
        <WheelButton
          keyId="Wheel4"
          onKeyClick={handleKeyClick}
          selectedKeyId={selectedKey?.id}
          className="-bottom-20 absolute"
          action={currentMapping.mapping['Wheel4'][mode]}
        />
        <div className="flex gap-2 items-center justify-center">
          <WheelButton
            keyId="Scroll"
            onKeyClick={handleKeyClick}
            selectedKeyId={selectedKey?.id}
            className=""
            action={currentMapping.mapping['Scroll'][mode]}
          />
          <WheelButton
            keyId="Enter"
            onKeyClick={handleKeyClick}
            selectedKeyId={selectedKey?.id}
            className=""
            action={currentMapping.mapping['Enter'][mode]}
          />
        </div>
      </div>
    </div>
  )
}

interface WheelButtonProps {
  keyId: string
  onKeyClick: (keyId: string) => void
  selectedKeyId: string | undefined
  action: ActionReference | undefined
  className?: string
}

const WheelButton: React.FC<WheelButtonProps> = ({
  keyId,
  onKeyClick,
  selectedKeyId,
  action,
  className
}: WheelButtonProps) => {
  const handleClick = (): void => {
    onKeyClick(keyId)
  }
  return (
    <div className={`${className}`}>
      <Button
        className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${selectedKeyId == keyId ? 'bg-zinc-800' : 'bg-zinc-900'}`}
        onClick={handleClick}
      >
        <div className={`text-xs -translate-y-10 absolute `}>{keyId}</div>
        <ActionIcon className="w-fit h-fit" action={action} />
      </Button>
    </div>
  )
}

export default WheelPage
