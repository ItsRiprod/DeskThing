import { useNotificationStore } from '@renderer/stores'
import React from 'react'

const IssuesPage: React.FC = () => {
  const issues = useNotificationStore((state) => state.issues)

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Issues</h1>
      {issues.length > 0 ? (
        <div className="w-full h-full relative overflow-y-auto">
          <div className="absolute inset-0 w-full h-full">
            {issues.map((issue, index) => (
              <div key={index} className="group">
                <div className="bg-zinc-900 shadow-md rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
                  <p className="text-gray-500 group-hover:text-gray-400 mb-2">
                    {issue.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">ID: {issue.id}</span>
                  </div>
                  {issue.error && <p className="text-red-600 mt-2">Error: {issue.error}</p>}
                  {(issue.steps?.length || 0) > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Steps:</h3>
                      <ul className="list-disc list-inside">
                        {issue.steps &&
                          issue.steps.map((step, taskIndex) => (
                            <li key={taskIndex} className="text-gray-500 hover:text-gray-400">
                              {step.task}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
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

export default IssuesPage
