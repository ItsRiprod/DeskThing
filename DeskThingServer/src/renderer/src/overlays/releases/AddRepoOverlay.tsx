import { IconArrowRight, IconUpload, IconLoading } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { FC, useState, useMemo } from 'react'

interface AddRepoProps {
  onClose: () => void
  onAdd: (url: string) => void
  existingRepositories?: string[]
}

const AddRepoOverlay: FC<AddRepoProps> = ({ onClose, onAdd, existingRepositories }) => {
  const [repoUrl, setRepoUrl] = useState('')
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = (): void => {
    if (isValid) {
      onAdd(processedUrl)
      onClose()
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
        await window.electron.app.addApp({ appPath: file })
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
        <div className="flex justify-between items-center">
          <Button
            onClick={handleUploadClick}
            className="hover:bg-zinc-800"
            disabled={loading}
          >
            {selectingFile ? <IconLoading strokeWidth={1.5} /> : <IconUpload strokeWidth={1.5} />}
            Upload Local App
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