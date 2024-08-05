import React from 'react'
import { Button } from './Devices'

interface KeyProps {
  keyName: string
  currentFunction: Button
  onSelect: (key: string) => void
}

const Key: React.FC<KeyProps> = ({ keyName, currentFunction, onSelect }) => {
  const handleButtonClick = (): void => {
    onSelect(keyName)
  }

  return (
    <div className="flex">
      <button className="border p-3 rounded-2xl hover:bg-zinc-600" onClick={handleButtonClick}>
        {keyName} {currentFunction?.name}
      </button>
    </div>
  )
}

export default Key
