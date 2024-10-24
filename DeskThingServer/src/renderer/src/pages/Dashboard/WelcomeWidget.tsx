import React, { useState, useEffect } from 'react'
import { IconLogoGear } from '@renderer/assets/icons'

const WelcomeWidget: React.FC = () => {
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-full relative overflow-hidden">
      <div className="w-full h-full flex justify-center items-center">
        <IconLogoGear className="animate-[spin_1s_ease-in-out_1]" iconSize={150} />
        {
          <h1
            className={`text-2xl font-semibold transition-all duration-500 overflow-hidden text-nowrap ${showText ? 'w-[270px]' : 'w-0'}`}
          >
            Welcome to DeskThing
          </h1>
        }
      </div>
    </div>
  )
}
export default WelcomeWidget
