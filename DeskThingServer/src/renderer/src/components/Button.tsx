import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: (e) => void
  className?: string
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  onMouseEnter?: () => void
}
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  href,
  target,
  rel,
  disabled,
  onMouseEnter
}) => {
  const baseClasses = 'flex-row flex p-3 bg-black hover:font-semibold rounded-md'
  const combinedClasses = `${baseClasses} ${className}`

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={combinedClasses}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      className={combinedClasses}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
