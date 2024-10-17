import { IconCarThing, IconComputer, IconMobile } from '@renderer/assets/icons'
import { Client } from '@shared/types'
import React from 'react'

interface ClientComponentProps {
  client: Client
}

const ClientComponent: React.FC<ClientComponentProps> = ({ client }) => {
  const renderIcon = (): JSX.Element => {
    if (!client.device_type) return <IconComputer iconSize={128} />

    switch (client.device_type.id) {
      case 1:
        return <IconComputer iconSize={128} />
      case 2:
        return <IconComputer iconSize={128} />
      case 3:
        return <IconMobile iconSize={128} />
      case 4:
        return <IconCarThing iconSize={128} />
      default:
        return <IconComputer iconSize={128} />
    }
  }

  return (
    <div className="border-t-2 w-full border-gray-500 flex p-2">
      {renderIcon()}
      <div>
        <h1 className="text-xl font-semibold">{client.client_name || 'Unknown Client'}</h1>
        <p>Version {client.version || 'unknown'}</p>
        <p>
          {client.ip || 'unknown'}:{client.port || '0000'}
        </p>
        <p>{client.connectionId}</p>
        <p>{client.device_type?.name || 'unknown'}</p>
      </div>
    </div>
  )
}

export default ClientComponent
