import { FC } from 'react'
import { TaskProps } from './TaskBase'
import { IconLink } from '@renderer/assets/icons'
import Button from '../Button'
import { usePageStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'

export const TaskShortcut: FC<TaskProps> = ({ step }) => {
  if (step.type != 'shortcut') return null
  const setPage = usePageStore((state) => state.setPage)
  const [_searchParams, setSearchParams] = useSearchParams()

  const handleServerRouting = async (): Promise<void> => {
    console.log('ServerRoutingListener', step.destination)
    const [path, query] = step.destination.split('?')
    setPage(path)

    if (query) {
      const newParams = new URLSearchParams(query)
      setSearchParams(newParams)
    }
  }

  return (
    <div className="flex">
      <Button onClick={handleServerRouting}>
        <IconLink />
      </Button>
    </div>
  )
}
export default TaskShortcut
