import React from 'react'
import Button from './Button'
import { GithubAsset } from '@shared/types'
import { IconDownload } from '@renderer/assets/icons'

/**
 * Props interface for the ReleaseComponent
 * @interface AssetComponentProps
 * @property {GithubAsset} asset - The GitHub release asset information
 * @property {Function} onClick - Callback function triggered when the download button is clicked
 * @property {boolean} loading - Loading state for the download button
 */
interface AssetComponentProps {
  asset: GithubAsset
  onClick: (asset: GithubAsset) => void
  loading: boolean
}

/**
 * Component that displays a GitHub release asset with a download button
 * @param {AssetComponentProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const ReleaseComponent: React.FC<AssetComponentProps> = ({ asset, onClick, loading }) => {
  return (
    // Container with border and flex layout
    <div className="flex border-2 p-2 border-gray-500 items-center justify-between rounded-xl">
      {/* Asset name display */}
      <h3 className="pl-5 font-semibold">{asset.name}</h3>
      {/* Download button with dynamic styling based on loading state */}
      <Button
        onClick={() => onClick(asset)}
        className={`border-green-500 ${loading ? '' : 'hover:bg-green-500 group'} flex gap-2`}
        disabled={loading}
      >
        {/* Hidden text that appears on hover */}
        <p className="group-hover:block hidden">Download</p>
        <IconDownload />
      </Button>
    </div>
  )
}

export default ReleaseComponent
