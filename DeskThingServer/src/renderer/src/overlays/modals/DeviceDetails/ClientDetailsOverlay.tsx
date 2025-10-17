import React, { useMemo } from 'react'
import Overlay from '../../Overlay'
import { Client, PlatformIDs } from '@deskthing/types'
import { DeviceDetails } from './DeviceDetails'
import ADBDeviceDetails from './ADBDetails'
import Button from '@renderer/components/buttons/Button'
import ErrorBoundary from '@renderer/components/ErrorBoundary'
import WebsocketDetails from './WebsocketDetails'
import { useSearchParams } from 'react-router-dom'

interface ClientDetailsOverlayProps {
  onClose: () => void
  client: Client
}

const ClientDetailsOverlay: React.FC<ClientDetailsOverlayProps> = ({ onClose, client }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedIdentifier = (searchParams.get('page') as PlatformIDs) || PlatformIDs.MAIN

  const setSelectedIdentifier = (identifier: PlatformIDs): void => {
    searchParams.set('page', identifier)
    setSearchParams(searchParams)
  }

  const DetailsPage = useMemo(() => {
    if (selectedIdentifier === PlatformIDs.MAIN) {
      return <DeviceDetails client={client} />
    }
    const identifier = client.identifiers[selectedIdentifier]
    switch (identifier?.providerId) {
      case PlatformIDs.ADB:
        return <ADBDeviceDetails client={client} />
      case PlatformIDs.WEBSOCKET:
        return <WebsocketDetails client={client} />
      default:
        return <DeviceDetails client={client} />
    }
  }, [selectedIdentifier, client])

  return (
    <Overlay
      onClose={onClose}
      className="border border-zinc-800 bg-zinc-900 xs:w-11/12 xs:h-5/6 w-full h-full sm:w-5/6 sm:max-h-5/6 sm:h-5/6"
    >
      <div className="flex h-full flex-col max-h-full">
        <div className="w-full py-4 px-5 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              client.connectionState === 0 || client.connectionState === 1
                ? 'bg-green-500'
                : client.connectionState === 2
                  ? 'bg-orange-500'
                  : 'bg-red-500'
            }`}
          />
          <h1 className="font-semibold text-2xl">Device {client.clientId}</h1>
        </div>{' '}
        <div className="flex flex-grow max-h-full overflow-hidden">
          <div className="border-r border-zinc-800 p-2 flex flex-col gap-2">
            <ErrorBoundary>
              <NavComponent
                setIdentifier={setSelectedIdentifier}
                identifier={PlatformIDs.MAIN}
                currentIdentifier={selectedIdentifier}
                label="General"
              />
              {Object.keys(client.identifiers).map((id) => (
                <NavComponent
                  key={id}
                  setIdentifier={setSelectedIdentifier}
                  identifier={id as PlatformIDs}
                  currentIdentifier={selectedIdentifier}
                  label={id}
                />
              ))}
            </ErrorBoundary>
          </div>
          <div className="w-full overflow-y-auto">
            <ErrorBoundary key={selectedIdentifier}>{DetailsPage}</ErrorBoundary>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

interface NavComponentProps {
  setIdentifier: (identifier: PlatformIDs) => void
  identifier: PlatformIDs
  currentIdentifier: PlatformIDs
  label: string
}

const NavComponent = ({
  setIdentifier,
  identifier,
  currentIdentifier,
  label
}: NavComponentProps): React.ReactElement => (
  <Button
    onClick={() => setIdentifier(identifier)}
    className={`px-2 ${currentIdentifier === identifier ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
  >
    <p>{label.charAt(0).toUpperCase() + label.slice(1)}</p>
  </Button>
)

export default ClientDetailsOverlay
