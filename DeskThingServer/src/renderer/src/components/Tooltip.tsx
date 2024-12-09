interface TooltipProps {
  text: string
  bottom?: boolean
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ text, bottom = true, className }: TooltipProps) => {
  return (
    <div
      className={`hidden absolute w-fit h-full bottom-full group-hover:flex ${bottom ? 'translate-y-[200%] items-start' : 'translate-y items-end'}`}
    >
      <p
        className={`${className || 'text-white z-10 text-sm bg-black'} text-nowrap px-2 py-1 rounded-md`}
      >
        {text}
      </p>
    </div>
  )
}

export default Tooltip
