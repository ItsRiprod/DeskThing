import React, { useState } from 'react'
import DOMPurify from 'dompurify'

interface UserProps {
  name: string
  role?: string
  contribution?: string
  avatar?: string
}

const User: React.FC<UserProps> = ({ name, contribution, avatar }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const sanitizedName = DOMPurify.sanitize(name)
  const sanitizedContribution = contribution ? DOMPurify.sanitize(contribution) : ''

  return (
    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-700/80 transition-all duration-200 group">
      {avatar ? (
        <img
          src={avatar}
          alt={sanitizedName}
          className="w-10 h-10 rounded-full bg-zinc-700 ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/70 transition-all duration-300"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-zinc-100 font-semibold text-sm ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/70 transition-all duration-300">
          {sanitizedName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium">{sanitizedName}</div>
        {sanitizedContribution && (
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm text-zinc-400 group-hover:text-emerald-300 transition-colors duration-200 cursor-pointer ${!isExpanded && 'line-clamp-1'}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContribution }}
          />
        )}
      </div>
    </div>
  )
}

export default User