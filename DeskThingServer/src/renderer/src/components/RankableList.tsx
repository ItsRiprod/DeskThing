import React, { useEffect, useState } from 'react'
import { SettingOption } from '@shared/types'
import { IconArrowDown, IconArrowUp } from '@renderer/assets/icons'

type RankableListProps = {
  options: SettingOption[]
  value: string[]
  onChange: (orderedOptions: string[]) => void
}

const RankableList: React.FC<RankableListProps> = ({ options, onChange, value }) => {
  const [orderedOptions, setOrderedOptions] = useState<SettingOption[]>(options)

  useEffect(() => {
    // Sort options based on the value order
    const sortedOptions = [...options].sort((a, b) => {
      const aIndex = value.indexOf(a.value)
      const bIndex = value.indexOf(b.value)
      return aIndex - bIndex
    })
    setOrderedOptions(sortedOptions)
  }, [options, value]) // Re-run when options or value change

  const handleMoveUp = (index: number): void => {
    if (index > 0) {
      const newOptions = [...orderedOptions]
      ;[newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]]
      setOrderedOptions(newOptions)
      onChange(newOptions.map((option) => option.value))
    }
  }

  const handleMoveDown = (index: number): void => {
    if (index < orderedOptions.length - 1) {
      const newOptions = [...orderedOptions]
      ;[newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]]
      setOrderedOptions(newOptions)
      onChange(newOptions.map((option) => option.value))
    }
  }

  return (
    <div className="w-full">
      {orderedOptions.map((option, index) => (
        <div
          key={option.value}
          className="flex gap-3 items-center hover:bg-zinc-950 justify-between w-full border-t relative border-gray-900"
        >
          <div className="flex-1 flex items-center">
            <p className="cursor-help break-words max-w-xs">{option.label}</p>
          </div>
          <div className="p-1 flex flex-col items-center">
            <button
              onClick={() => handleMoveUp(index)}
              className={`p-1 rounded-md hover:bg-zinc-800 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <IconArrowUp className="stroke-2 text-gray-400" />
            </button>
            <button
              onClick={() => handleMoveDown(index)}
              className={`p-1 rounded-md hover:bg-zinc-800 ${
                index === orderedOptions.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <IconArrowDown className="stroke-2 text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RankableList
