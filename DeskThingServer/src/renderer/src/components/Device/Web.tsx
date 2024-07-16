import { useEffect, useState } from 'react'
import { IconLogoLoading } from '../icons'
import axios from 'axios'

const Web = (): JSX.Element => {
  const [releases, setReleases] = useState<string[]>([])

  useEffect(() => {
    axios.get('https://api.github.com/repos/ItsRiprod/DeskThing/tags').then((response) => {
      const releaseNames = response.data.map((release: any) => release.name)
      setReleases(releaseNames)
    })
  }, [])

  return (
    <div className="pt-5 flex flex-col justify-around items-center">
      <IconLogoLoading iconSize={250} />
      <p className="logo">Unimplemented</p>
      <select>
        <option value="">Select a release</option>
        {releases.map((release) => (
          <option key={release} value={release}>{release}</option>
        ))}
      </select>
    </div>
  )
}

export default Web
