import React, { ReactNode } from 'react'

interface WidgetProps {
  children: ReactNode
}

const Widget: React.FC<WidgetProps> = ({ children }) => {
  return (
    <div className="border overflow-hidden w-full rounded-2xl border-gray-500 hover:bg-slate-900">{children}</div>
  )
}

export default Widget
