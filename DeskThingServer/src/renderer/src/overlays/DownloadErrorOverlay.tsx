import Button from '@renderer/components/Button'

interface DownloadErrorOverlayProps {
  error: string
  onAcknowledge: () => void
  title?: string
  inset?: boolean
}

export const DownloadErrorOverlay = ({
  error,
  onAcknowledge,
  title,
  inset = false
}: DownloadErrorOverlayProps): JSX.Element => {
  return (
    <div
      className={`${inset ? '' : 'fixed'} w-full h-full top-0 left-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm transition-all`}
    >
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-red-500 text-white p-6 rounded-2xl shadow-2xl shadow-red-800/40 ring-2 ring-red-400/30 animate-fade-in">
        <h1 className="text-lg font-bold mb-2 text-red-400 drop-shadow">
          {title || 'There was an error:'}
        </h1>
        <code className="bg-black/80 p-3 text-red-300 rounded-lg font-mono block mb-4 shadow-inner shadow-red-900/40">
          {error.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </code>
        <Button
          onClick={onAcknowledge}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-150"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
