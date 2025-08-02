import { IconLoading, IconPlus } from '@renderer/assets/icons'
import { FC } from 'react'
import { useSearchParams } from 'react-router-dom'

export const AddCard: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const handleShowReleaseModal = (): void => {
    searchParams.set('addrepo', 'true')
    setSearchParams(searchParams)
  }

  return (
    <>
      <div className="w-full h-full min-h-40 relative flex-grow flex items-center justify-center border rounded-xl border-zinc-900 bg-zinc-950 transition-all duration-300 group hover:shadow-emerald-500 hover:border-emerald-500 hover:bg-gradient-to-br hover:from-zinc-950 hover:to-emerald-950 hover:scale-[1.01]">
        {searchParams.get('addrepo') === 'true' ? (
          <div>
            <IconLoading className="w-16 h-16 text-zinc-300" />
          </div>
        ) : (
          <>
            <button
              onClick={handleShowReleaseModal}
              className="relative w-full h-full flex flex-col items-center justify-center focus:outline-none"
            >
              <IconPlus className="w-16 h-16 text-zinc-300 transition-all duration-300 group-hover:text-emerald-400 group-hover:scale-110 group-hover:-rotate-12" />
              <span className="absolute opacity-0 group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300 text-emerald-400 font-semibold text-lg mt-20 pointer-events-none">
                Add
              </span>
              <span className="absolute inset-0 rounded-xl pointer-events-none group-hover:animate-pulse-glow" />
            </button>
          </>
        )}
      </div>
    </>
  )
}
