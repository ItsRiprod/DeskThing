import { useNotificationStore } from '@renderer/stores'
import React from 'react'

const ClientSettings: React.FC = () => {
  const issues = useNotificationStore((state) => state.issues)

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Issues</h1>
      {issues.length > 0 ? (
        <div className="w-full h-full relative overflow-y-auto">
          <div className="absolute inset-0 w-full h-full">
            {issues.map((issue, index) => (
              <div key={index}>
                <li className="bg-white shadow-md rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
                  <p className="text-gray-600 mb-2">{issue.description}</p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        issue.status === 'pending'
                          ? 'bg-yellow-200 text-yellow-800'
                          : issue.status === 'in_progress'
                            ? 'bg-blue-200 text-blue-800'
                            : issue.status === 'complete'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">ID: {issue.id}</span>
                  </div>
                  {issue.error && <p className="text-red-600 mt-2">Error: {issue.error}</p>}
                  {issue.tasks.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Tasks:</h3>
                      <ul className="list-disc list-inside">
                        {issue.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="text-gray-700">
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-500">No issues found.</p>
        </div>
      )}
    </div>
  )
}

export default ClientSettings
