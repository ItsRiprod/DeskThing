/**
 * A React component that renders a button or a link with consistent styling.
 *
 * @param children - The content to be displayed inside the button or link.
 * @param onClick - An optional click event handler for the button or link.
 * @param className - An optional additional CSS class name to apply to the button or link.
 * @param href - An optional URL to use for the link.
 * @param target - An optional target attribute for the link.
 * @param rel - An optional rel attribute for the link.
 * @param style - An optional inline style object to apply to the button or link.
 * @param disabled - An optional boolean to disable the button.
 * @param onMouseEnter - An optional mouse enter event handler for the button or link.
 */
import React, { Ref } from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: (e) => void
  className?: string
  href?: string
  target?: string
  rel?: string
  ref?: Ref<HTMLButtonElement>
  style?: React.CSSProperties
  title?: string
  disabled?: boolean
  onMouseEnter?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
}
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  href,
  title,
  target,
  rel,
  ref,
  style,
  disabled,
  onMouseEnter,
  onMouseDown
}) => {
  const baseClasses = 'relative group flex-row flex p-3 hover:font-semibold rounded-md'
  const combinedClasses = `${baseClasses} ${className}`

  if (href) {
    return (
      <a
        href={href}
        style={style}
        target={target}
        title={title}
        aria-label={title}
        rel={rel}
        className={combinedClasses}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseDown={onMouseDown}
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
      ref={ref}
      title={title}
      aria-label={title}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
