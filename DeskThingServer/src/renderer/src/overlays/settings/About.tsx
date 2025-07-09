import React, { useState, useEffect } from 'react'
import Button from '@renderer/components/Button'
import { Member, Supporter } from '@shared/types/supporter'
import User from '@renderer/components/supporter/User'

import riprodAvatar from '@renderer/assets/images/authors/riprod.gif'
import thebigloudAvatar from '@renderer/assets/images/authors/thebigloud.webp'

const AboutSettings: React.FC = () => {
  const [supporters, setSupporters] = useState<{ monthly: Member[]; onetime: Supporter[] }>({
    monthly: [],
    onetime: []
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchSupporters = async (): Promise<void> => {
      try {
        setLoading(true)
        const response = await window.electron.utility.getSupporters({
          force: false,
          page: currentPage
        })
        if (response.items && response.items.length > 0) {
          setSupporters(response.items[0])
          setTotalPages(response.totalPages)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching supporters:', error)
        setSupporters({ monthly: [], onetime: [] })
        setLoading(false)
      }
    }

    fetchSupporters()
  }, [currentPage])

  return (
    <div className="absolute inset w-full h-full p-6 overflow-y-auto bg-zinc-900/95">
      <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-center mb-6 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 hover:shadow-emerald-400/20">
            <h1 className="text-3xl font-bold text-white">DeskThing</h1>
            <p className="text-emerald-100 mt-1">Transform your car thing into something awesome</p>
          </div>
        </div>

        <div>
          <h1 className="text-lg">Development Team</h1>
          <User
            avatar={riprodAvatar}
            name="Riprod"
            contribution="Lead Developer & Project Maintainer"
          />
          <User avatar={thebigloudAvatar} name="TheBigLoud" contribution="UI Designer" />
        </div>

        <div className="flex md:flex-row flex-col gap-4">
          <div className="w-full">
            <h1 className="text-lg">Monthly Supporters</h1>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-2 text-emerald-400">Loading supporters...</span>
              </div>
            ) : supporters.monthly && supporters.monthly.length > 0 ? (
              supporters.monthly.map((supporter) => (
                <User
                  key={supporter.supporterId}
                  name={supporter.name}
                  contribution={`${supporter.num_coffees} coffee${supporter.num_coffees > 1 ? 's' : ''} - ${supporter.message || ''}`}
                />
              ))
            ) : (
              <div className="text-center py-3 text-zinc-500 italic">No monthly supporters yet</div>
            )}
          </div>
          <div className="w-full">
            <h1 className="text-lg">One Time Supporters</h1>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-2 text-emerald-400">Loading supporters...</span>
              </div>
            ) : supporters.onetime && supporters.onetime.length > 0 ? (
              supporters.onetime.map((supporter) => (
                <User
                  key={supporter.supporterId}
                  name={supporter.name}
                  contribution={`${supporter.num_coffees} coffee${supporter.num_coffees > 1 ? 's' : ''} - ${supporter.message || ''}`}
                />
              ))
            ) : (
              <div className="text-center py-3 text-zinc-500 italic">
                No one-time supporters yet
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-4 py-2 rounded-md shadow-md font-medium transition-all duration-200 ${
                currentPage === 1
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white hover:shadow-emerald-500/10'
              }`}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 bg-zinc-800/50 rounded-md text-emerald-300 border border-zinc-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-4 py-2 rounded-md shadow-md font-medium transition-all duration-200 ${
                currentPage === totalPages
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white hover:shadow-emerald-500/10'
              }`}
            >
              Next
            </Button>
          </div>
        )}

        <div className="text-center text-zinc-500 text-sm p-4 mt-4 border-t border-zinc-800">
          <p className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>Support the project:</span>
            <a
              href="https://buymeacoffee.com/riprod"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/30 transition-colors duration-200 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                  clipRule="evenodd"
                />
              </svg>
              Buy Me A Coffee
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutSettings
