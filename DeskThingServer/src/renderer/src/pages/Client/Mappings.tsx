import { useEffect, useState } from 'react'
import { IconCarThing } from '../../assets/icons'

export type Action = {
  name: string
  id: string
  description: string
  source: string
}

export type Key = {
  id: string
  source: string
}

export enum EventFlavor {
  Up,
  Down,
  Left,
  Right,
  Short,
  Long
}

export type ButtonMapping = {
  [key: string]: {
    [flavor in EventFlavor]?: Action
  }
}
export type FileStructure = {
  default: ButtonMapping
  [key: string]: ButtonMapping | Action[] | Key[] | string
  actions: Action[]
  keys: Key[]
  version: string
}

const Mapping = (): JSX.Element => {
  const [mapping, setMapping] = useState<ButtonMapping>({})
  const [buttons, setButtons] = useState<Key[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [currentAction, setCurrentAction] = useState<Action | null>(null)
  const [currentKey, setCurrentKey] = useState('')
  const [selectedFlavor, setSelectedFlavor] = useState<EventFlavor>(EventFlavor.Short)
  const [tooltip, setToolTip] = useState<string>('')

  useEffect(() => {
    const loadMapping = async (): Promise<void> => {
      try {
        const mappings = (await window.electron.getMaps()) as FileStructure
        console.log(mappings)
        setMapping(mappings.default)
        setActions(mappings.actions)
        setButtons(mappings.keys)
      } catch (error) {
        console.error('Error loading mappings:', error)
      }
    }

    loadMapping()
  }, [])

  const handleFlavorSelect = (flavor: EventFlavor): void => {
    setSelectedFlavor(flavor)
    if (mapping && currentKey && mapping[currentKey][flavor]) {
      setCurrentAction(mapping[currentKey][flavor])
    } else {
      setCurrentAction(null)
    }
  }

  const handleButtonSelect = async (action: Action): Promise<void> => {
    if (!currentKey) return

    const newMapping = {
      ...mapping,
      [currentKey]: {
        ...mapping[currentKey],
        [selectedFlavor]: action
      }
    }
    console.log('Sending mappings')
    setMapping(newMapping)
    try {
      await window.electron.setMaps('default', newMapping)
    } catch (error) {
      console.error('Failed to save mappings:', error)
    }
    if (action) {
      setCurrentAction(action)
    } else {
      setCurrentAction(null)
    }
  }

  const handleSelect = async (selectedKey: string): Promise<void> => {
    setCurrentKey(selectedKey)
    if (mapping && selectedFlavor && mapping[selectedKey][selectedFlavor]) {
      setCurrentAction(mapping[selectedKey][selectedFlavor])
    } else {
      setCurrentAction(null)
    }
  }

  return (
    <div className="pt-5 h-full flex lg:flex-row flex-col w-full p-5">
      <div className="pt-5 flex flex-col items-center p-5">
        <div className="flex flex-wrap group hover:bg-zinc-950 max-w-full hover:border-l py-5 pl-1 border-zinc-500">
          {actions.map((action, index) => (
            <button
              className={`p-3 border ${currentAction && currentAction.id == action.id ? 'border-cyan-500 hover:bg-cyan-500' : 'text-zinc-500 group-hover:text-white border-zinc-900 hover:bg-zinc-600'}`}
              key={index}
              onClick={() => handleButtonSelect(action)}
              onMouseEnter={() => setToolTip(action.description)}
              onMouseLeave={() => setToolTip('')}
            >
              {action.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap hover:bg-zinc-950 max-w-full hover:border-l pl-1 border-zinc-500 py-5">
          {buttons &&
            buttons.map((button) => {
              const currentAction = mapping[button.id][selectedFlavor] || {
                name: 'No Action',
                id: 'none',
                description: 'No action assigned',
                source: 'none'
              }
              return (
                <button
                  key={button.id}
                  onMouseEnter={() => setToolTip('Source: ' + button.source)}
                  onMouseLeave={() => setToolTip('')}
                  onClick={() => handleSelect(button.id)}
                  className={`group flex border min-w-40 p-3 ${currentKey != button.id ? (currentAction.id == 'none' ? 'border-zinc-700 text-zinc-700' : 'border-zinc-400 hover:bg-zinc-700') : 'border-cyan-500 bg-cyan-950 text-white hover:bg-cyan-500'}`}
                >
                  <div className="flex justify-between w-full">
                    <p className="group-hover:hidden">{button.id}</p>
                    <p className="group-hover:block hidden">{currentAction?.name}</p>
                  </div>
                </button>
              )
            })}
        </div>
        <div className="flex mb-3 hover:bg-zinc-950 w-full justify-center hover:border-l pl-1 border-zinc-500 py-5">
          {Object.values(EventFlavor)
            .filter((value) => typeof value === 'number')
            .map((flavor) => (
              <button
                key={flavor}
                className={`p-2 m-1 ${selectedFlavor === flavor ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
                onClick={() => handleFlavorSelect(flavor)}
              >
                {EventFlavor[flavor]}
              </button>
            ))}
        </div>
      </div>
      <div className="lg:border-l-2 lg:border-b-2 lg:border-t-0 border-t-2 flex flex-col p-3">
        <p className="font-semibold">{tooltip ? tooltip : 'Details...'}</p>
        <IconCarThing
          iconSize={256}
          strokeWidth={5}
          highlightColor={'cyan'}
          highlighted={[currentKey]}
        />
        <div className="italic font-extralight text-left">
          <p>Any button with a number in the name will pass that number to the action</p>
          <p>e.g. Digit1 will set pref to 1</p>
        </div>
        <div className="w-full flex items-end justify-end grow bottom-0 text-zinc-600 italic">
          <p>Will be updated in v0.9.0</p>
        </div>
      </div>
    </div>
  )
}

export default Mapping
