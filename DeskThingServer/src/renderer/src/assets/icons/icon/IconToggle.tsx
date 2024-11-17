import { Icon, IconProps } from '.'
import { useEffect, useRef } from 'react'

interface ToggleProps extends IconProps {
  checked: boolean
  disabled?: boolean
}

function IconToggle({ disabled = false, checked, ...props }: ToggleProps): JSX.Element {
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setAttribute('cx', checked ? '16' : '8')
      const animation = circleRef.current.querySelector('animate')
      if (animation) {
        animation.setAttribute('from', checked ? '8' : '16')
        animation.setAttribute('to', checked ? '16' : '8')
        animation.beginElement()
      }
    }
  }, [checked])

  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <rect width="20" height="12" x="2" y="6" rx="6" ry="6" />
        <circle
          ref={circleRef}
          cx={checked ? '16' : '8'}
          cy="12"
          r="5"
          fill={disabled ? `gray` : 'white'}
        >
          <animate
            attributeName="cx"
            from={checked ? '8' : '16'}
            to={checked ? '16' : '8'}
            dur="0.1s"
            fill="freeze"
          />
        </circle>
      </svg>
    </Icon>
  )
}

export default IconToggle
