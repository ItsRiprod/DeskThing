import { IconArrowRight, IconUpload, IconLoading } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { useReleaseStore } from '@renderer/stores'
import { AppLatestServer, ClientLatestServer } from '@shared/types'
import { FC, useState, useMemo, useEffect } from 'react'

interface AddRepoProps {
  onClose: () => void
  onZipUpload: (zipUrl: string) => Promise<void>
}

const AddRepoOverlay: FC<AddRepoProps> = ({ onClose, onZipUpload }) => {
  const [repoUrl, setRepoUrl] = useState('')
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)
  const addRepo = useReleaseStore((state) => state.addRepositoryUrl)
  const [addedRepos, setAddedRepos] = useState<(AppLatestServer | ClientLatestServer)[]>([])
  const [existingRepositories, setExistingRepos] = useState<string[]>([])

  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | undefined>()

  const getAppRepositories = useReleaseStore((releaseStore) => releaseStore.getAppReferences)
  const getClientRepositories = useReleaseStore((releaseStore) => releaseStore.getClientRepos)

  useEffect(() => {
    const fetchRepos = async (): Promise<void> => {
      const appRepos = await getAppRepositories()
      const clientRepos = await getClientRepositories()
      if (appRepos || clientRepos) {
        setExistingRepos(appRepos.concat(clientRepos))
      }
    }
    fetchRepos()
  }, [getAppRepositories, getClientRepositories])

  const { processedUrl, isValid } = useMemo(() => {
    let processed = repoUrl
    let valid = false
    if (repoUrl) {
      // Handle 'username/repo' format
      if (repoUrl.match(/^[^/]+\/[^/]+$/)) {
        processed = `https://api.github.com/repos/${repoUrl}`
      }

      // Handle full GitHub URLs
      if (repoUrl.includes('github.com')) {
        // Convert github.com URLs to API URLs
        processed = processed.replace('github.com', 'api.github.com/repos')
        // Remove trailing .git if present
        processed = processed.replace(/\.git$/, '')
        // Remove trailing slashes
        processed = processed.replace(/\/$/, '')
      }
      valid = /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(processed)
    }
    return { processedUrl: processed, isValid: valid }
  }, [repoUrl])

  const handleSubmit = async (): Promise<void> => {
    setFeedback(undefined)
    try {
      if (isValid) {
        const release = await addRepo(processedUrl)
        setFeedback({ message: `Added ${processedUrl} successfully`, success: true })
        if (release) {
          setAddedRepos((prev) => [...prev, ...release])
        } else {
          setFeedback({
            message: `Encountered an error processing ${processedUrl}! Check logs for details`,
            success: false
          })
        }
      } else {
        setFeedback({ message: `URL ${processedUrl} is not valid!`, success: false })
      }
    } catch {
      setFeedback({
        message: `Encountered an error processing ${processedUrl}!`,
        success: false
      })
    }
  }

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    setLoading(true)
    const file = await window.electron.utility.selectZipFile()
    setSelectingFile(false)
    setLoading(false)
    if (file) {
      setLoading(true)
      try {
        await onZipUpload(file)
        onClose()
      } catch {
        setLoading(false)
      }
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg w-96">
        <h2 className="text-xl font-semibold text-white">Add Repository</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">GitHub Repository</label>
          <input
            type="text"
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="username/repo or repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            list="existing-repos"
          />
          {existingRepositories && existingRepositories.length > 0 && (
            <datalist id="existing-repos">
              {existingRepositories.map((repo, index) => (
                <option key={index} value={repo} />
              ))}
            </datalist>
          )}
          {repoUrl && (
            <div className="text-sm text-zinc-400">
              {processedUrl}
              {!isValid && <div className="text-red-500">Invalid repository URL format</div>}
            </div>
          )}
        </div>
        {feedback && (
          <div
            className={`border-l pl-2 ${feedback.success ? 'border-green-800' : 'border-red-800'}`}
          >
            <p className="text-xs text-neutral-500">{feedback.message}</p>
            {!feedback.success && (
              <a
                className="text-xs text-blue-500"
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Downloading Manually
              </a>
            )}
          </div>
        )}

        {addedRepos && addedRepos.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Added Repositories</label>
            <div className="max-h-32 overflow-y-auto">
              {addedRepos.map((latestServer, index) => (
                <div key={index} className="text-sm text-white p-2 bg-zinc-800 rounded mb-1">
                  {latestServer.type === 'client' ? (
                    <div className="flex flex-col">
                      <p className="font-medium">{latestServer.mainRelease.clientManifest.name}</p>
                      <p className="text-xs text-zinc-400">
                        v{latestServer.mainRelease.clientManifest.version} • By{' '}
                        {latestServer.mainRelease.clientManifest.author || 'Unknown'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <p className="font-medium">{latestServer.mainRelease.appManifest.label}</p>
                      <p className="text-xs text-zinc-400">
                        v{latestServer.mainRelease.appManifest.version} • By{' '}
                        {latestServer.mainRelease.appManifest.author || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <Button onClick={handleUploadClick} className="hover:bg-zinc-800" disabled={loading}>
            {selectingFile ? <IconLoading strokeWidth={1.5} /> : <IconUpload strokeWidth={1.5} />}
            Upload Local File
          </Button>
          <Button
            title="Add Repository"
            onClick={handleSubmit}
            className={`hover:bg-zinc-800 ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isValid}
          >
            Add Repository
            <IconArrowRight />
          </Button>
        </div>
      </div>
    </Overlay>
  )
}

export default AddRepoOverlay
