import React, { useEffect, useState, useRef, useMemo } from 'react'
import useLogStore from '../../stores/logStore'
import useSettingsStore from '../../stores/settingsStore'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import Button from '@renderer/components/Button'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import {
  IconCheck,
  IconCopy,
  IconFolderOpen,
  IconRefresh,
  IconToggle
} from '@renderer/assets/icons'
import { useReward } from 'react-rewards'
import { Log, LOG_CONTEXTS, LOG_FILTER } from '@shared/types'
import { LOGGING_LEVELS } from '@deskthing/types'

const colorMap = {
  [LOGGING_LEVELS.ERROR]: 'text-red-300',
  [LOGGING_LEVELS.FATAL]: 'text-red-400',
  [LOGGING_LEVELS.WARN]: 'text-yellow-300',
  [LOGGING_LEVELS.MESSAGE]: 'text-blue-300',
  [LOGGING_LEVELS.DEBUG]: 'text-purple-300',
  [LOGGING_LEVELS.LOG]: 'text-gray-500'
}

const logLevelOptions = [
  { value: LOG_FILTER.DEBUG, label: 'Debug' },
  { value: LOG_FILTER.MESSAGE, label: 'Message' },
  { value: LOG_FILTER.INFO, label: 'Info' },
  { value: LOG_FILTER.WARN, label: 'Warning' },
  { value: LOG_FILTER.ERROR, label: 'Error' },
  { value: LOG_FILTER.FATAL, label: 'Fatal' },
  { value: LOG_FILTER.SILENT, label: 'Silent' }
]

const contextOptions = Object.values(LOG_CONTEXTS).map((ctx) => ({
  value: ctx,
  label: ctx
}))

const Logs: React.FC = () => {
  const logList = useLogStore((state) => state.logList)
  const relaunchWithTerminal = useLogStore((state) => state.relaunchWithTerminal)
  const settings = useSettingsStore((s) => s.settings)
  const savePartialSettings = useSettingsStore((s) => s.savePartialSettings)
  const [contextFilter, setContextFilter] = useState<LOG_CONTEXTS[]>(settings.server_LogContext)
  const [logLevel, setLogLevel] = useState<LOG_FILTER>(settings.server_LogLevel)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { reward, isAnimating } = useReward('logRewardId', 'confetti')
  const [loading, setLoading] = useState<boolean>(false)
  // Collapsible settings state
  const [settingsOpen, setSettingsOpen] = useState(true)
  // Debounced update settings when log level/context changes
  useEffect(() => {
    const handler = setTimeout(() => {
      savePartialSettings({
        server_LogLevel: logLevel,
        server_LogContext: contextFilter
      })
    }, 1000)
    return () => clearTimeout(handler)
  }, [logLevel, contextFilter, savePartialSettings])

  // Filter logs by level and context
  const filteredLogs = useMemo(() => {
    return logList.filter((log) => {
      const contextMatch =
        contextFilter.length === 0
          ? true
          : contextFilter.includes(log.options.context || LOG_CONTEXTS.SERVER)
      return contextMatch
    })
  }, [logList, contextFilter])

  useEffect(() => {
    if (logContainerRef.current && autoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleLogsOpen = (): void => {
    window.electron.utility.openLogsFolder()
  }

  const handleCopyLogs = (): void => {
    const logsText = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.options.date || '2024-11-17T11:16:16.970Z').toLocaleTimeString()} ${log.options.source}]: ${log.log}`
      )
      .join('\n')
    navigator.clipboard.writeText(logsText)
    reward()
  }

  const handleRelaunchWithTerminal = async (): Promise<void> => {
    setLoading(true)
    const success = await relaunchWithTerminal()
    if (success) {
      setLoading(false)
      window.location.reload()
    } else {
      console.error('Failed to relaunch with terminal')
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex">
      <Sidebar className="flex justify-between flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div className="flex flex-col gap-2">
          <Button onClick={handleLogsOpen} className="hover:bg-zinc-900">
            <IconFolderOpen strokeWidth={1.5} />
            <p className="md:block xs:hidden text-center flex-grow">Open Logs</p>
          </Button>
          <Button onClick={handleCopyLogs} className="hover:bg-zinc-900" disabled={isAnimating}>
            <span id="logRewardId" />
            {isAnimating ? <IconCheck strokeWidth={1.5} /> : <IconCopy strokeWidth={1.5} />}
            <p className="md:block xs:hidden text-center flex-grow">Copy Logs</p>
          </Button>
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            className="items-center justify-center hover:bg-zinc-900"
          >
            <IconToggle
              className={autoScroll ? `text-green-500` : `text-red-500`}
              checked={autoScroll}
              strokeWidth={1.5}
              iconSize={30}
            />
            <p className="md:block xs:hidden text-center flex-grow">Autoscroll</p>
          </Button>
          <Button
            onClick={handleRelaunchWithTerminal}
            className="flex hover:bg-zinc-900/50 bg-zinc-900 items-center gap-2 px-3 py-1.5 rounded-md transition-colors shadow"
            title="Relaunch DeskThing with the terminal for all of the logs to be visible"
            disabled={loading}
          >
            <IconRefresh
              className={`text-white ${loading ? 'animate-spin-smooth' : 'md:hidden'}`}
              strokeWidth={1.7}
              iconSize={24}
            />
            <p
              className={`${loading ? 'hidden' : 'md:block xs:hidden'} flex-grow font-medium text-center`}
            >
              Restart With Logs
            </p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="flex flex-col max-h-full h-full px-2 py-4 bg-zinc-950 border-b border-zinc-900">
          <div className="flex items-center mb-4 justify-between">
            <span className="font-semibold text-gray-300">Settings</span>
            <button
              type="button"
              className="px-2 py-1 rounded text-xs bg-zinc-800 text-gray-300 border border-zinc-700 hover:bg-zinc-700 transition"
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-label={settingsOpen ? 'Collapse settings' : 'Expand settings'}
            >
              {settingsOpen ? 'Hide' : 'Show Setting Options'}
            </button>
          </div>
          <div
            className={`flex gap-4 items-center transition-all h-full border-b border-zinc-800 ${settingsOpen ? 'max-h-[80px] pb-4' : 'max-h-0 overflow-hidden'}`}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Log Level</label>
              <Select
                options={logLevelOptions}
                value={logLevel}
                placeholder={logLevel}
                onChange={(selected) => {
                  const selectedValue = selected as SingleValue<{
                    value: LOG_FILTER
                    label: string
                  }>
                  setLogLevel(selectedValue?.value || LOG_FILTER.INFO)
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Context Filter</label>
              <div className="flex gap-1 bg-zinc-900 rounded p-2">
                {contextOptions.map((option) => {
                  const checked = contextFilter.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`px-2 py-1 rounded text-xs border ${checked ? 'bg-emerald-700 text-white border-emerald-500' : 'bg-zinc-800 text-gray-300 border-zinc-700'} transition`}
                      onClick={() => {
                        setContextFilter((prev) =>
                          checked ? prev.filter((v) => v !== option.value) : [...prev, option.value]
                        )
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div
            ref={logContainerRef}
            className="w-full h-full bg-black shadow-2xl p-5 max-w-full overflow-auto"
          >
            {filteredLogs.length > 0 ? (
              <ul className="gap-2 flex flex-col">
                {filteredLogs.map((log, index) => (
                  <LogItem key={`${log.options.date}-${index}`} log={log} />
                ))}
              </ul>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-white">No logs available.</p>
              </div>
            )}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

const LogItem: React.FC<{
  log: Log
}> = ({ log }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyLogs = (): void => {
    let logContent = log.log
    // Try to pretty-print any JSON substring in log.log
    const jsonRegex = /({[\s\S]*}|\[[\s\S]*\])/
    const match = log.log.match(jsonRegex)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        const prettyJson = JSON.stringify(parsed, null, 2)
        logContent = log.log.replace(match[0], prettyJson)
      } catch {
        // Not valid JSON, leave as is
      }
    }
    const logsText = `\`\`\`\n${log.options.context} ${log.options.store}${log.options.method && `(${log.options.method})`} ${logContent}${log.options.error ? ` - ${log.options.error.message} - ${log.options.error.stack} - ${String(log.options.error.cause)}` : ''}\n\`\`\``
    navigator.clipboard.writeText(logsText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <li
      className={`group flex hover:bg-zinc-950 relative items-center justify-between font-geistMono whitespace-pre-wrap shadow ${copied ? 'cursor-auto' : 'hover:cursor-pointer'}`}
      style={{ cursor: copied ? 'auto' : 'pointer' }}
      onClick={handleCopyLogs}
    >
      <div className="flex flex-col gap-1 w-3/4">
      <span className="font-bold text-xs text-gray-400">
        {log.options.context}
        {log.options.store && `.${log.options.store}`}
        {log.options.method && `(${log.options.method})`}
      </span>
      <span className={`break-words ${colorMap[log.type]}`}>{log.log}</span>
      {log.options.error?.message && (
        <span className="text-xs font-geistMono italic text-red-400">
        ERROR: {log.options.error?.message}
        </span>
      )}
      </div>
      <div className="flex flex-col items-end w-1/4">
      <span className="text-xs italic text-gray-500 group-hover:text-gray-300">
        [{new Date(log.options.date as string).toLocaleTimeString()}]
      </span>
      <span className="text-xs text-gray-400">{log.options.source}</span>
      </div>
      <div
      className={`flex items-center absolute h-full justify-center w-full gap-2 py-2 ${copied ? 'bg-black/75 opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}
      >
      <IconCopy className="text-green-400" strokeWidth={1.5} />
      <span className="text-green-400 font-semibold">Log Copied to Clipboard</span>
      </div>
    </li>
  )
}

export default Logs
