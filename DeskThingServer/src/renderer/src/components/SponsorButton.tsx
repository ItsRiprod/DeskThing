import { IconCoffee } from '@renderer/assets/icons'
import React from 'react'
import { useReward } from 'react-rewards'
import Button from './Button'

const SponsorButton: React.FC = () => {
  const confettiConfig = {
    startVelocity: 6,
    elementCount: 7,
    decay: 0.99
  }
  const { reward } = useReward('rewardId', 'confetti', confettiConfig)

  return (
    <Button
      href="https://deskthing.app/support"
      target="_blank"
      rel="noreferrer"
      className="group fill-fuchsia-600 hover:bg-fuchsia-600 hover:text-black text-fuchsia-600"
      onMouseEnter={reward}
    >
      <span id="rewardId" />
      <IconCoffee iconSize={24} strokeWidth={2} />
      <p className="flex-grow text-center text-lg md:block hidden group-hover:hidden">Coffee</p>
      <p className="flex-grow text-center text-lg group-hover:md:block hidden">Support</p>
    </Button>
  )
}

export default SponsorButton
