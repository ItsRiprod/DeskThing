import React, { useState, useEffect } from 'react'
import { IconDiscord, IconLink, IconYoutube } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import landingAnimation from '@renderer/assets/animations/Landing Animation-v2.json'

const WelcomeWidget: React.FC = () => {
  const [showText, setShowText] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-full relative overflow-hidden">
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="flex gap-2 px-28 sm:px-0 sm:w-[500px] items-center justify-center">
          <Lottie animationData={landingAnimation} loop={false} />
        </div>
        <div className="flex justify-between gap-4 mt-5">
          <Button
            onClick={() => window.open('https://deskthing.app/discord', '_blank')}
            className={`delay-100 text-sm items-center border-[#5865f2] border gap-1 hover:bg-[#5865F2] group hover:text-white transition-[transform,opacity] duration-500 overflow-hidden text-nowrap ${showText ? 'opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            <IconDiscord className="as fill-[#5865f2] group-hover:fill-white" color={'red'} />
            <p className="group-hover:hidden">Join My Crew</p>
            <p className="group-hover:inline hidden">Discord Invite</p>
          </Button>
          <Button
            onClick={() => navigate('?notifications=true&page=task')}
            className={`delay-200 text-sm bg-zinc-900 hover:bg-zinc-800 items-center gap-2 transition-[opacity,transform] duration-500 overflow-hidden text-nowrap ${showText ? 'opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            Get Started
            <IconLink />
          </Button>
          <Button
            onClick={() => window.open('https://deskthing.app/youtube', '_blank')}
            className={`delay-300 text-sm items-center border-[#ff0033] border gap-1 hover:bg-[#ff0033] group hover:text-white transition-[transform,opacity] duration-500 overflow-hidden text-nowrap ${showText ? 'opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            <IconYoutube className="fill-[#ff0033] group-hover:fill-white" />
            <p className="group-hover:hidden">Youtube</p>
            <p className="group-hover:inline hidden">Youtube</p>
          </Button>
        </div>
      </div>
    </div>
  )
}
export default WelcomeWidget
