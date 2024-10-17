import React from 'react'
import Button from './Button'
import { GithubAsset } from '@shared/types'
import { IconDownload } from '@renderer/assets/icons'

interface AssetComponentProps {
  asset: GithubAsset
  onClick: (asset: GithubAsset) => void
  loading: boolean
}

const ReleaseComponent: React.FC<AssetComponentProps> = ({ asset, onClick, loading }) => {
  return (
    <div className="flex border-2 p-2 border-gray-500 items-center justify-between rounded-xl">
      <h3 className="pl-5 font-semibold">{asset.name}</h3>
      <Button
        onClick={() => onClick(asset)}
        className={`border-green-500 ${loading ? '' : 'hover:bg-green-500 group'} flex gap-2`}
        disabled={loading}
      >
        <p className="group-hover:block hidden">Download</p>
        <IconDownload />
      </Button>
    </div>
  )
}

export default ReleaseComponent
