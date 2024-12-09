import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: (e) => void
  className?: string
  href?: string
  target?: string
  rel?: string
  style?: React.CSSProperties
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
  style,
  disabled,
  onMouseEnter
}) => {
  const baseClasses = 'relative group flex-row flex p-3 hover:font-semibold rounded-md'
  const combinedClasses = `${baseClasses} ${className}`

  if (href) {
    return (
      <a
        href={href}
        style={style}
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
      style={style}
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
