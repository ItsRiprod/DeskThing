import { IconArrowRight } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import useMappingStore from '@renderer/stores/mappingStore'
import { Profile } from '@shared/types'
import { FC, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const AddProfileOverlay: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const addProfile = useMappingStore((state) => state.addProfile)
  const getProfiles = useMappingStore((state) => state.getProfiles)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile>({
    version: '',
    version_code: 0,
    id: '',
    name: '',
    description: '',
    trigger_app: '',
    extends: ''
  })

  useEffect(() => {
    const fetchProfiles = async (): Promise<void> => {
      const profiles = await getProfiles()
      setProfiles(profiles)
    }

    fetchProfiles()
  }, [getProfiles])

  const onClose = (): void => {
    searchParams.delete('addProfile')
    setSearchParams(searchParams)
  }

  const handleSubmit = (): void => {
    if (profile.name) {
      addProfile(profile)
      onClose()
    }
  }

  const handleChange = (field: keyof Profile, value: string): void => {
    if (field === 'name') {
      setProfile((prev) => ({
        ...prev,
        name: value,
        id: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }))
    } else {
      setProfile((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg w-96">
        <h2 className="text-xl font-semibold text-white">Add New Profile</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Profile Name</label>
          <input
            type="text"
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter profile name"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Description</label>
          <input
            type="text"
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter profile description"
            value={profile.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Base Profile</label>
          <select
            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
            value={profile.extends}
            onChange={(e) => handleChange('extends', e.target.value)}
          >
            <option value="">Select a profile to copy from</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} className="hover:bg-zinc-800">
            Create Profile
            <IconArrowRight />
          </Button>
        </div>
      </div>
    </Overlay>
  )
}

export default AddProfileOverlay
