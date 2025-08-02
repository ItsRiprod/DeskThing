import React from 'react'
import { AppSettingProps } from './AppsOverlay'
import useTaskStore from '@renderer/stores/taskStore'
import TaskComponent from '@renderer/components/tasks/TaskComponent'

const AppTasks: React.FC<AppSettingProps> = ({ app, onClose }) => {
  const tasks = useTaskStore((state) => state.taskList[app.name] || {})

  return (
    <div className="w-full h-full p-6 flex flex-col">
      {Object.values(tasks).length > 0 ? (
        Object.values(tasks).map((task) => (
          <TaskComponent task={task} key={task.id} onClose={onClose} />
        ))
      ) : (
        <div className="w-full flex-col h-full flex items-center justify-center">
          <h2>No tasks found ¯\_(ツ)_/¯</h2>
        </div>
      )}
    </div>
  )
}
export default AppTasks
