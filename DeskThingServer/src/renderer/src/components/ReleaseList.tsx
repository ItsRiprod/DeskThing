import React from 'react'
import { IconArrowDown, IconArrowRight } from './icons'
import { GithubAsset, GithubRelease } from '../store/githubStore'

interface ReleaseListProps {
  releases: GithubRelease[]
  openReleaseId: number | null
  toggleDropdown: (releaseId: number) => void
  filterAssets: (assets: GithubAsset[]) => GithubAsset[]
  handleAssetClick: (asset: GithubAsset) => Promise<void>
}

const ReleaseList: React.FC<ReleaseListProps> = ({
  releases,
  openReleaseId,
  toggleDropdown,
  filterAssets,
  handleAssetClick
}) => {
  return releases.map((release) => (
    <div key={release.id} className="mx-5 border-l-2 rounded-xl border-zinc-700">
      <button
        className="w-full justify-between flex px-4 py-4 text-left border-t-2 rounded-xl border-zinc-700 hover:bg-zinc-900 focus:outline-none"
        onClick={() => toggleDropdown(release.id)}
      >
        {release.name}
        {openReleaseId === release.id ? (
          <IconArrowDown iconSize={28} />
        ) : (
          <IconArrowRight iconSize={28} />
        )}
      </button>
      {openReleaseId === release.id && (
        <div className="pl-4">
          {filterAssets(release.assets).map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleAssetClick(asset)}
              className="group m-2 flex gap-2 text-zinc-300 hover:text-white border border-green-400 hover:bg-green-400 p-2 rounded-lg"
            >
              <h2 className="font-geistMono">{asset.name}</h2>
            </button>
          ))}
        </div>
      )}
    </div>
  ))
}

export default ReleaseList
