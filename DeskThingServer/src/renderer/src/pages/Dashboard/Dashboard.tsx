import React, { useState } from 'react'
import LogsWidget from './LogsWidget'
import ClientsWidget from './ClientsWidget'
import InfoWidget from './InfoWidget.tsx'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import WelcomeWidget from './WelcomeWidget'

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
    <div className={`bg-zinc-900 h-full w-full rounded-lg p-1 ${sizeClasses[size]}`} {...props}>
      {children}
    </div>
  )
}

interface DashboardItemProps {
  size: 'small' | 'horizontal' | 'vertical'
  Component?: React.ComponentType
}

const DashboardItem: React.FC<DashboardItemProps> = ({ size, Component }) => {
  return <Widget size={size}>{Component && <Component />}</Widget>
}

const Dashboard: React.FC = () => {
  const [items] = useState<DashboardItemProps[]>([
    { size: 'small', Component: ClientsWidget },
    { size: 'horizontal', Component: WelcomeWidget },
    { size: 'vertical', Component: LogsWidget },
    { size: 'horizontal', Component: LogsWidget },
    { size: 'small', Component: InfoWidget }
  ])

  return (
    <div className="flex w-full h-full">
      <Sidebar>
        <p></p>
      </Sidebar>
      <MainElement>
        <div className="grid overflow-auto grid-cols-4 grid-rows-2 gap-4 p-4 w-full h-full">
          {items.map((item, index) => (
            <DashboardItem key={index} {...item} />
          ))}
        </div>
      </MainElement>
    </div>
  )
}

export default Dashboard
