import React, { useState } from 'react'

interface WidgetProps {
  size: 'small' | 'horizontal' | 'vertical'
}

const Widget: React.FC<WidgetProps & React.HTMLAttributes<HTMLDivElement>> = ({
  size,
  children,
  ...props
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    horizontal: 'col-span-2 row-span-1',
    vertical: 'col-span-1 row-span-2'
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-4 shadow-md ${sizeClasses[size]}`} {...props}>
      {children}
    </div>
  )
}

interface DashboardItemProps {
  type: string
  size: 'small' | 'horizontal' | 'vertical'
}

const DashboardItem: React.FC<DashboardItemProps> = ({ type, size }) => {
  return (
    <Widget size={size}>
      <h3 className="text-lg font-semibold">{type}</h3>
      {/* Add specific widget content here */}
    </Widget>
  )
}

const Dashboard: React.FC = () => {
  const [items] = useState<DashboardItemProps[]>([
    { type: 'Logs', size: 'small' },
    { type: 'Devices', size: 'horizontal' },
    { type: 'Tasks', size: 'vertical' },
    { type: 'Clients', size: 'small' },
    { type: 'Apps', size: 'horizontal' }
  ])

  return (
    <div className="grid grid-cols-4 gap-4 p-4 w-full h-full">
      {items.map((item, index) => (
        <DashboardItem key={index} {...item} />
      ))}
    </div>
  )
}

export default Dashboard
