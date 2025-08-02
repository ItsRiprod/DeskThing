import { IconLink, IconLoading, IconArrowRight } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { GithubRepository } from '@shared/types'
import { FC } from 'react'
import { useSearchParams } from 'react-router-dom'

// RepoCard: displays a single repo, styled and clickable
interface RepoCardProps {
  repo: GithubRepository
  onAdd: (repoUrl: string) => Promise<void>
  isLoading?: boolean
  isAdded?: boolean
  id?: string // Optional ID for the repo, used for download page navigation
}

export const RepoCard: FC<RepoCardProps> = ({ repo, onAdd, isLoading, isAdded, id }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const handleClick = async (): Promise<void> => {
    if (!isLoading && !isAdded) {
      await onAdd(repo.url)
    }
  }

  const handleOpenRepoClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    window.open(repo.html_url, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    console.log('Navigating to repo id download:', id)
    searchParams.set('download_page', `${id}`)
    searchParams.delete('addrepo')
    setSearchParams(searchParams) // closes the main UI and then opens the page
  }

  return (
    <div
      className={`flex flex-row items-center gap-4 p-4 border rounded-lg transition-all duration-300 bg-zinc-950
        ${isAdded ? 'border-emerald-500 shadow-emerald-500/40' : 'cursor-pointer border-zinc-900 hover:border-emerald-400 hover:shadow-emerald-500/20'}
        ${isLoading ? 'opacity-60 pointer-events-none' : ''}
      `}
      onClick={handleClick}
      title={isAdded ? 'Already Added' : 'Add Repository'}
      style={{ minWidth: 0 }}
    >
      <button
        title="Open Repository"
        className="flex-shrink-0 relative w-14 h-14 rounded-lg bg-zinc-900 flex items-center justify-center"
        onClick={handleOpenRepoClick}
      >
        <img
          src={repo.owner.avatar_url}
          alt={repo.full_name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
        <div className="flex items-center justify-center transition-opacity rounded-full opacity-0 hover:opacity-100 absolute bg-gray-900/75 w-full h-full">
          <IconLink />
        </div>
      </button>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="font-semibold text-base text-white truncate">{repo.full_name}</div>
        <div className="text-xs text-zinc-400 truncate">{repo.description || 'No description'}</div>
        <div className="flex gap-2 mt-1 text-xs text-zinc-500">
          <span>⭐ {repo.stargazers_count}</span>
        </div>
      </div>
      <Button
        title={isAdded ? 'Added' : 'Add'}
        className={`ml-4 px-3 py-1 flex items-center gap-2 transition-all duration-300
          ${isAdded ? 'bg-emerald-900 text-emerald-300' : 'hover:bg-zinc-800'}
          rounded font-semibold`}
        disabled={isAdded || isLoading}
      >
        {isLoading ? <IconLoading className="w-5 h-5 animate-spin-smooth" /> : <IconArrowRight />}
        {isAdded ? 'Added' : 'Add'}
      </Button>
      {isAdded && id && (
        <Button
          title={'Go to downloads page'}
          className={`ml-4 px-3 py-1 flex items-center gap-2 transition-all duration-300
          ${'hover:bg-zinc-800'}
          rounded font-semibold`}
          disabled={isLoading}
          onClick={handleDownloadClick}
        >
          Download
          <IconLink className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}
