import React from 'react'
import { Action } from './Devices'

interface KeyProps {
  keyName: string
  currentAction: Action
  currentKey: string
  onSelect: (key: string) => void
}

const Key: React.FC<KeyProps> = ({ keyName, currentKey, currentAction, onSelect }) => {
  const handleButtonClick = (): void => {
    onSelect(keyName)
  }

  return (
    <button
      onClick={handleButtonClick}
      className={`group flex border min-w-40 p-3 ${currentKey != keyName ? (currentAction.id == 'none' ? 'border-zinc-600 text-zinc-600' : 'hover:bg-zinc-600') : 'border-cyan-500 text-white hover:bg-cyan-500'} rounded-2xl`}
    >
      <div className="flex justify-between w-full">
        <p className="group-hover:hidden">{keyName}</p>
        <p className="group-hover:block hidden">{currentAction?.name}</p>
      </div>
    </button>
  )
}

export default Key
