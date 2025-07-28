import { IconArrowRight, IconLink, IconLoading } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { useReleaseStore } from '@renderer/stores'
import { GithubRepository } from '@shared/types'
import { FC, useEffect, useState } from 'react'

// RepoCard: displays a single repo, styled and clickable
interface RepoCardProps {
  repo: GithubRepository
  onAdd: (repoUrl: string) => Promise<void>
  isLoading?: boolean
  isAdded?: boolean
}

export const RepoCard: FC<RepoCardProps> = ({ repo, onAdd, isLoading, isAdded }) => {
  const handleClick = async (): Promise<void> => {
    if (!isLoading && !isAdded) {
      await onAdd(repo.url)
    }
  }

  const handleOpenRepoClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    window.open(repo.html_url, '_blank', 'noopener,noreferrer')
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
    </div>
  )
}

// AddReleaseModal: lists repos, allows selection
interface AddReleaseProps {
  onClose: () => void
}

const AddReleaseModal: FC<AddReleaseProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | undefined>()
  const [localAddedRepos, setAddedRepoUrls] = useState<string[]>([])

  const extraRepositories = useReleaseStore((state) => state.extraRepositories)
  const fetchExtraRepositories = useReleaseStore((state) => state.fetchExtraRepositories)
  const addRepo = useReleaseStore((state) => state.addRepositoryUrl)

  const appIds = useReleaseStore((state) => state.appReleases).map(
    (app) => app.mainRelease.repository
  )
  const clientIds = useReleaseStore((state) => state.clientReleases).map(
    (client) => client.mainRelease.repository
  )
  const addedRepoUrls: string[] = [...appIds, ...clientIds, ...localAddedRepos]

  // Fetch repos on mount
  useEffect(() => {
    if (!extraRepositories && !loading) {
      setLoading(true)
      fetchExtraRepositories().finally(() => setLoading(false))
    }
  }, [extraRepositories, loading, fetchExtraRepositories])

  // Add repo handler
  const handleAddRepo = async (repoUrl: string): Promise<void> => {
    setFeedback(undefined)
    setLoading(true)
    try {
      const release = await addRepo(repoUrl)
      if (release) {
        setAddedRepoUrls((prev) => [...prev, repoUrl])
        setFeedback({ message: `Added ${repoUrl} successfully`, success: true })
      } else {
        setFeedback({
          message: `Encountered an error processing ${repoUrl}! Check logs for details`,
          success: false
        })
      }
    } catch {
      setFeedback({
        message: `Encountered an error processing ${repoUrl}!`,
        success: false
      })
    }
    setLoading(false)
  }

  return (
    <Overlay
      onClose={onClose}
      className="flex flex-col bg-zinc-950 rounded-xl w-[95vw] max-h-[90vh] max-w-3xl border border-zinc-900 shadow-emerald-500/20"
    >
      <div className="flex flex-col items-center justify-center py-6 px-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">Add a Release</h2>
        <p className="text-sm text-zinc-400 mb-4 text-center">
          Select a repository to add as a release. Only public repositories are shown.
        </p>
      </div>
      <div className="flex-1 px-6 pb-2 overflow-y-auto" style={{ minHeight: 0 }}>
        {!extraRepositories ? (
          <div className="flex flex-col items-center justify-center py-8">
            <IconLoading className="w-16 h-16 text-emerald-300 animate-spin-smooth" />
            <p className="text-sm text-zinc-400 mt-2">Loading repositories...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {extraRepositories.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                onAdd={handleAddRepo}
                isLoading={loading}
                isAdded={addedRepoUrls.includes(repo.url)}
              />
            ))}
          </div>
        )}
      </div>
      {feedback && (
        <div
          className={`mx-6 border-l-4 pl-3 py-2 mt-2 rounded-lg ${
            feedback.success
              ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
              : 'border-red-600 bg-red-950/40 text-red-300'
          }`}
        >
          <p className="text-xs">{feedback.message}</p>
        </div>
      )}
      <div className="flex justify-end px-6 py-4">
        <Button
          title="Close"
          onClick={onClose}
          className="hover:bg-zinc-800 rounded-lg px-4 py-2 font-semibold"
        >
          Close
        </Button>
      </div>
    </Overlay>
  )
}

export default AddReleaseModal
