import TaskBase from '@renderer/components/tasks/TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import React, { useMemo } from 'react'

const AdbPage: React.FC = () => {
  const taskList = useTaskStore((state) => state.taskList)

  const setupTask = useMemo(() => {
    return taskList.server?.device
  }, [taskList?.server?.device])

  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="p-8 text-3xl font-bold text-white">Car Thing ADB Setup</h1>
      <div className="w-full flex-col flex items-center justify-center h-full">
        <div className="bg-zinc-900 p-8 rounded-lg shadow-lg text-center border border-green-500/20 transition-shadow hover:shadow-green-500/20 hover:shadow-xl">
          <p className="text-lg text-gray-300 mb-4">
            The following is the ADB task. They can also be found here in the task list
          </p>
          <div className="h-full max-h-72 flex flex-col overflow-y-auto">
            {setupTask && <TaskBase task={setupTask} source="server" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdbPage
