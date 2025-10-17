import { FC } from 'react'
import { FlashPages, PageOutline } from './SuperbirdPage'
import Button from '@renderer/components/buttons/Button'
import { IconLightning } from '@renderer/assets/icons'

interface Dashboard {
  pages: PageOutline
  openPage: (pageId: FlashPages) => void
}

export const DashboardPage: FC<Dashboard> = ({ pages, openPage }) => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <IconLightning className="text-emerald-500" />
        <h1 className="text-2xl font-bold">Device Flashing</h1>
      </div>
      <div className="flex flex-col items-center gap-6">
        <Button
          onClick={() => openPage('autoconfig')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
        >
          <p className="text-white text-xl font-medium">Configuration Wizard</p>
        </Button>
        <div className="flex items-center gap-4 w-full">
          <div className="h-px flex-1 bg-neutral-600"></div>
          <p className="text-neutral-400 font-medium">OR</p>
          <div className="h-px flex-1 bg-neutral-600"></div>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full">
          {Object.entries(pages).map(
            ([id, { completed, icon: Icon, text, requires, completionText }], index) => {
              const isDisabled = requires?.some((req) => !pages[req]?.completed)

              return (
                <div
                  key={id}
                  className={`flex flex-col border rounded-lg transition-all duration-200 ${
                    completed
                      ? 'border-green-500 bg-green-500/10 dark:bg-green-500/5'
                      : 'border-neutral-400 hover:border-blue-400'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => !isDisabled && openPage(id as FlashPages)}
                >
                  <p className="text-xs p-1 text-neutral-500">Step {index + 1}</p>
                  <div className="flex px-3 items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-full ${completed ? 'bg-green-500/20 dark:bg-green-500/10' : 'bg-gray-100 dark:bg-gray-800'}`}
                    >
                      <Icon
                        width={24}
                        height={24}
                        className={
                          completed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      />
                    </div>
                    <span className="text-lg font-medium">{text}</span>
                  </div>
                  <div className="flex px-3 items-center">
                    {completed ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {completionText || 'Completed'}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {isDisabled ? 'Complete prerequisites first' : 'Pending'}
                      </span>
                    )}
                  </div>
                  {index < Object.entries(pages).length - 1 && (
                    <div className="mt-3 px-3 pb-4 text-sm text-gray-500 dark:text-gray-400">
                      {completed
                        ? 'Step completed'
                        : requires?.length
                          ? `Requires: ${requires.join(', ')}`
                          : 'Complete this step to proceed'}
                    </div>
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>
    </div>
  )
}
