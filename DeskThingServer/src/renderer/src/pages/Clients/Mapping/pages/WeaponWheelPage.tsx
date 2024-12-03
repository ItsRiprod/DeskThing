import { PageProps } from '..'

const WheelPage: React.FC<PageProps> = ({
  onMappingChange,
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode
}: PageProps) => {
  return (
    <div className="h-full flex flex-col w-full">
      <p>Wheel Page</p>
    </div>
  )
}

export default WheelPage
