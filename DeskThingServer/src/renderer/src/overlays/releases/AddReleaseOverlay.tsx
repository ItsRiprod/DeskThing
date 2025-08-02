import { IconLoading } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { useReleaseStore } from '@renderer/stores'
import { FC, useEffect, useMemo, useState } from 'react'
import { RepoCard } from './RepoCard'
import { useSearchParams } from 'react-router-dom'

/**
 * Normalizes GitHub repository URLs to a consistent format for comparison
 * Handles various GitHub URL formats and extracts owner/repo
 */
const normalizeGitHubUrl = (url: string): string => {
  if (!url) return ''

  try {
    // Remove trailing slashes and convert to lowercase
    const cleanUrl = url.trim().toLowerCase().replace(/\/+$/, '')

    // Match different GitHub URL patterns
    const patterns = [
      // API URLs: https://api.github.com/repos/owner/repo
      /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)/,
      // Regular GitHub URLs: https://github.com/owner/repo
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)/,
      // SSH URLs: git@github.com:owner/repo.git
      /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?/,
      // Git protocol: git://github.com/owner/repo.git
      /^git:\/\/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match) {
        const [, owner, repo] = match
        // Return normalized format: owner/repo
        return `${owner}/${repo}`.toLowerCase()
      }
    }

    // If no pattern matches, return the original URL for fallback comparison
    return cleanUrl
  } catch (error) {
    console.warn('Failed to normalize GitHub URL:', url, error)
    return url.toLowerCase()
  }
}

/**
 * Creates a map of normalized repository identifiers to app/client IDs
 */
const createRepoMap = (
  releases: Array<{
    mainRelease: {
      repository: string
      appManifest?: { id: string }
      clientManifest?: { id: string }
    }
  }>
): Map<string, string> => {
  const repoMap = new Map<string, string>()

  for (const release of releases) {
    const normalizedRepo = normalizeGitHubUrl(release.mainRelease.repository)
    const id = release.mainRelease.appManifest?.id || release.mainRelease.clientManifest?.id

    if (normalizedRepo && id) {
      repoMap.set(normalizedRepo, id)
    }
  }

  return repoMap
}

/**
 * Checks if a repository is already installed by comparing normalized URLs
 */
const isRepoInstalled = (
  repoUrl: string,
  installedRepos: Map<string, string>
): { isInstalled: boolean; installedId?: string } => {
  const normalizedUrl = normalizeGitHubUrl(repoUrl)

  if (installedRepos.has(normalizedUrl)) {
    return {
      isInstalled: true,
      installedId: installedRepos.get(normalizedUrl)
    }
  }

  return { isInstalled: false }
}

const AddReleaseModal: FC = () => {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | undefined>()
  const [localAddedRepos, setAddedRepoUrls] = useState<Set<string>>(new Set())
  const [searchParams, setSearchParams] = useSearchParams()

  const extraRepositories = useReleaseStore((state) => state.extraRepositories)
  const fetchExtraRepositories = useReleaseStore((state) => state.fetchExtraRepositories)
  const addRepo = useReleaseStore((state) => state.addRepositoryUrl)
  const appReleases = useReleaseStore((state) => state.appReleases)
  const clientReleases = useReleaseStore((state) => state.clientReleases)

  // Create normalized repository maps
  const installedRepos = useMemo(() => {
    const appRepoMap = createRepoMap(appReleases)
    const clientRepoMap = createRepoMap(clientReleases)

    // Combine both maps
    return new Map([...appRepoMap, ...clientRepoMap])
  }, [appReleases, clientReleases])

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
        setAddedRepoUrls((prev) => new Set(prev).add(normalizeGitHubUrl(repoUrl)))
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

  const onClose = (): void => {
    console.log('Closing')
    searchParams.delete('addrepo')
    setSearchParams(searchParams)
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
            {extraRepositories.map((repo) => {
              const { isInstalled, installedId } = isRepoInstalled(repo.url, installedRepos)
              const isLocallyAdded = localAddedRepos.has(normalizeGitHubUrl(repo.url))

              return (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onAdd={handleAddRepo}
                  isLoading={loading}
                  isAdded={isInstalled || isLocallyAdded}
                  id={installedId}
                />
              )
            })}
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
