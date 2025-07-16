import { IconInfo } from '@renderer/assets/icons'
import React from 'react'

interface InfoComponentProps {
  title?: string
  description?: string
  className?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
}

export const InfoComponent: React.FC<InfoComponentProps> = ({
  title,
  description,
  className,
  side = 'top'
}) => {
  const [show, setShow] = React.useState(false)

  return (
    <div
      className="relative flex items-center group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className={`w-4 h-4 flex items-center justify-center rounded-full ${className ? className : 'text-gray-500 hover:text-gray-300'}`}
        aria-label="More info"
        tabIndex={0}
        onClick={() => setShow((prev) => !prev)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        <IconInfo />
      </button>
      {(title || description) && show && (
        <div
          className={`absolute z-50 w-48 bg-black border text-white border-gray-200 rounded shadow-lg p-2 text-xs
        ${
          side === 'top'
            ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
            : side === 'bottom'
              ? 'top-full left-1/2 transform -translate-x-1/2 mt-2'
              : side === 'left'
                ? 'right-full top-1/2 transform -translate-y-1/2 mr-2'
                : side === 'right'
                  ? 'left-full top-1/2 transform -translate-y-1/2 ml-2'
                  : 'top-full left-1/2 transform -translate-x-1/2 mt-2'
        }
        `}
        >
          {title && <h2 className="font-semibold text-blue-700 mb-0.5">{title}</h2>}
          {description && description.split('\n').map((line, index) => <p key={index}>{line}</p>)}
        </div>
      )}
    </div>
  )
}
