import { useEffect, useState } from 'react'
import { IconCarThing } from '../icons'
import Key from './Key'

export type Button = {
  name: string
  description: string
  source: string
}

export type key = {
  id: string
  source: string
}

export type ButtonMapping = {
  [key: string]: Button
}

type FileStructure = {
  default: ButtonMapping
  [key: string]: ButtonMapping | Button[] | key[] | string
  functions: Button[]
  keys: key[]
  version: string
}

const Device = (): JSX.Element => {
  const [mapping, setMapping] = useState<ButtonMapping>({})
  const [buttons, setButtons] = useState<key[]>([])
  const [functions, setFunctions] = useState<Button[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [currentKey, setCurrentKey] = useState('')

  useEffect(() => {
    const loadMapping = async (): Promise<void> => {
      const mappings = (await window.electron.getMaps()) as FileStructure
      console.log(mappings)
      setMapping(mappings.default)
      setFunctions(mappings.functions)
      setButtons(mappings.keys)
    }

    loadMapping()
  }, [])

  const handleButtonSelect = async (button: Button): Promise<void> => {
    const newMapping = {
      ...mapping,
      [currentKey]: button
    }
    console.log('Sending mappings')
    setMapping(newMapping)
    setIsVisible(false)
    await window.electron.setMaps('default', newMapping)
  }
  const handleSelect = async (selectedKey: string): Promise<void> => {
    setCurrentKey(selectedKey)
    setIsVisible(true)
  }

  return (
    <div className="pt-5 flex flex-col w-full items-center p-5">
      <div className="flex overflow-x-scroll max-w-full">
        {isVisible &&
          functions.map((f, index) => (
            <button
              className="p-3 hover:bg-zinc-600"
              key={index}
              onClick={() => handleButtonSelect(f)}
            >
              {f.name}
            </button>
          ))}
      </div>
      <div className="flex overflow-x-scroll max-w-full">
        {buttons.map((button) => (
          <Key
            key={button.id}
            keyName={button.id}
            currentFunction={mapping[button.id]}
            onSelect={handleSelect}
          />
        ))}
      </div>
      <IconCarThing iconSize={256} highlightColor={'yellow'} highlighted={[currentKey]} />
    </div>
  )
}

export default Device
