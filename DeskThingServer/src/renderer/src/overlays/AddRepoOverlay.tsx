import { IconArrowRight } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { FC, useState, useMemo } from 'react'

interface AddRepoProps {
  onClose: () => void
  onAdd: (url: string) => void
}

const AddRepoOverlay: FC<AddRepoProps> = ({ onClose, onAdd }) => {
  const [repoUrl, setRepoUrl] = useState('')

  const { processedUrl, isValid } = useMemo(() => {
    let processed = repoUrl
    let valid = false

    if (repoUrl) {
      // Handle 'username/repo' format
      if (repoUrl.match(/^[^/]+\/[^/]+$/)) {
        processed = `https://github.com/${repoUrl}`
      }

      // Handle full GitHub URLs
      if (repoUrl.includes('github.com')) {
        // Remove trailing .git if present
        processed = processed.replace(/\.git$/, '')
        // Remove trailing slashes
        processed = processed.replace(/\/$/, '')
        // Validate GitHub URL format
      }
      valid = /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(processed)
    }

    return { processedUrl: processed, isValid: valid }
  }, [repoUrl])

  const handleSubmit = (): void => {
    if (isValid) {
      onAdd(processedUrl)
      onClose()
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
          />
          {repoUrl && (
            <div className="text-sm text-zinc-400">
              {processedUrl}
              {!isValid && <div className="text-red-500">Invalid repository URL format</div>}
            </div>
          )}
        </div>
        <div className="flex justify-end">
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
