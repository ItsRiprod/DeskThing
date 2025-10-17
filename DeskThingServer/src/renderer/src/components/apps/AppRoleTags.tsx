import { useSettingsStore } from '@renderer/stores'
import React from 'react'
import { useSearchParams } from 'react-router-dom'

type AppRoleTagProps = {
  appId: string
  className?: string
}

const ROLE_DEFINITIONS: Array<{
  label: string
  check: (appId: string, sets: RoleSets) => boolean
  className?: string
  link?: string
}> = [
  {
    label: 'Music Source',
    check: (appId, sets) => sets.musicSources.has(appId),
    className: 'bg-green-500/10 text-green-500 hover:bg-green-500/15',
    link: 'deskthing://apps/list?settings=true&page=music'
  },
  {
    label: 'Music Controller',
    check: (appId, sets) => sets.musicControls.has(appId),
    className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/15',
    link: 'deskthing://apps/list?settings=true&page=music'
  },
  {
    label: 'Voice Agent Source',
    check: (appId, sets) => sets.voiceAgents.has(appId),
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/15',
    link: 'deskthing://apps/list?settings=true&page=extras'
  },
  {
    label: 'Audio Source',
    check: (appId, sets) => sets.audioSource.has(appId),
    className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15',
    link: 'deskthing://apps/list?settings=true&page=music'
  }
]

type RoleSets = {
  musicSources: Set<string>
  musicControls: Set<string>
  voiceAgents: Set<string>
  audioSource: Set<string>
}

export const AppRoleTags: React.FC<AppRoleTagProps> = ({ appId, className }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const musicSources = useSettingsStore((state) => state.settings.music_sources_ids)
  const musicControls = useSettingsStore((state) => state.settings.music_control_id)
  const musicSource = useSettingsStore((state) => state.settings.music_playbackLocation)
  const voiceAgents = useSettingsStore((state) => state.settings.voice_agent_app_ids)

  const roleSets: RoleSets = {
    musicSources: new Set(musicSources),
    musicControls: new Set(musicControls),
    voiceAgents: new Set(voiceAgents),
    audioSource: new Set(musicSource ? [musicSource] : [])
  }

  const roles = ROLE_DEFINITIONS.filter((role) => role.check(appId, roleSets))

  // the active actions (i.e. any notifications or incomplete tasks) sent from the app that need attention

  if (roles.length === 0) return null

  // Helper to parse deskthing://apps/list?settings=true&page=music
  const openLink = (link?: string): void => {
    if (!link) return
    const url = new URL(link.replace('deskthing://', 'http://')) // dummy protocol for parsing
    url.searchParams.forEach((value, key) => {
      searchParams.set(key, value)
    })
    setSearchParams(searchParams)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {roles.map((role) => (
        <span
          key={role.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border-none ${role.className ?? 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/15'}`}
          style={{ cursor: role.link ? 'pointer' : undefined }}
          onClick={() => openLink(role.link)}
        >
          {role.label}
        </span>
      ))}
    </div>
  )
}
