import useTaskStore from '@renderer/stores/taskStore'
import { FC } from 'react'

export const StepImage: FC<{ imageId: string; source: string; className?: string }> = ({
  imageId,
  source,
  className
}) => {
  const url = useTaskStore.getState().getStepUrl(imageId, source)

  if (!url) return null

  console.log(`Rendering StepImage for ${imageId} from source ${source} at URL: ${url}`)

  return (
    <img
      src={url}
      alt={`Step ${imageId}`}
      className={className}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        height: 'auto',
        width: 'auto',
        display: 'block',
        objectFit: 'contain'
      }}
    />
  )
}
