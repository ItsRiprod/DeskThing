import { useEffect, useState } from 'react'
import ClientSettings from '../ClientSettings'
import { ClientStore } from '@renderer/store/'
import { IconCarThing, IconLogoGearLoading, IconRefresh } from '../icons'

const Walkthrough = (): JSX.Element => {
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [loading, setIsLoading] = useState<boolean>(false)
  const [connections, setConnections] = useState<number>(ClientStore.getConnections())

  useEffect(() => {
    const handleConnectedDevices = async (devices: string[] = []): Promise<void> => {
      if (devices.length > 0) {
        setConnectedDevices(devices)
      } else {
        const Devices = await ClientStore.getADBDevices()
        setConnectedDevices(Devices)
      }
    }
    handleConnectedDevices()
    const listener = ClientStore.on('ADBDevices', handleConnectedDevices)
    const otherListener = ClientStore.onConnection((connection) => setConnections(connection))

    return () => {
      listener()
      otherListener()
    }
  }, [])

  const refreshDeviceList = async (): Promise<void> => {
    setIsLoading(true)
    ClientStore.requestADBDevices()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="pt-5 grid gap-2 max-w-full overflow-hidden w-full items-center p-5">
      <div className="border-l py-3 mb-5 hover:bg-slate-950 pl-3 border-slate-600 hover:border-slate-400">
        <h1 className="text-2xl font-bold font-geist">Setting Up</h1>
        <div className="pl-3">
          <p className="pl-1">
            Hello! This is the first draft of a simple walkthrough tutorial for setting up your
            device
          </p>
          <h2 className="text-lg font-semibold">Setting up a Car Thing</h2>
          <p className="py-1">
            To set up your car thing, I highly recommend going to the{' '}
            <a
              className="underline text-blue-200 hover:text-blue-300"
              href="https://github.com/ItsRiprod/DeskThing?tab=readme-ov-file#flashing"
              target="_blank"
              rel="noreferrer"
            >
              DeskThing github readme
            </a>{' '}
            for detailed instructions on flashing your car thing. These are the steps in short:
            <li>Download the required tools</li>
            <li>Download the correct image</li>
            <li>Begin flashing process</li>
            <li>Unplug and plug in the car thing</li>
            <li>Check for devices</li>
            The current list of connected devices are:
            {connectedDevices.length > 0 ? (
              <div className="flex">
                {connectedDevices.map((device, index) => (
                  <IconCarThing key={index} text={device} iconSize={124} />
                ))}
              </div>
            ) : (
              <div>
                <button
                  className="group border-cyan-500 flex gap-3 border p-3 rounded-xl hover:bg-cyan-500"
                  onClick={refreshDeviceList}
                  disabled={loading}
                >
                  {!loading ? <IconRefresh /> : <IconLogoGearLoading />}
                  <p className="group-hover:block hidden">Refresh Devices</p>
                </button>
              </div>
            )}
            <p className="italic">it should show up above once it is connected and seen by ADB</p>
            <p className="italic">More details can be found in the Client tab</p>
            <li>
              Next, go to the Client tab and then Client Downloads. Once you come back, the
              following should say &quot;Staged: Deskthing Client&quot;
            </li>
            <div className="border border-slate-600 rounded-lg px-5 hover:bg-slate-700">
              <ClientSettings />
            </div>
            <li>Once it shows up, go to the Client tab and click Push Staged Client</li>
            <li>
              The Car Thing should restart. Go to the Client tab and click Open ADB Socket Port and
              you should see the number of connected clients go up by one:
            </li>
            <div>Number of connections: {connections}</div>
          </p>
          <h2 className="text-lg font-semibold">Setting up a Device (e.g. phone)</h2>
          <p className="pl-1">
            To set DeskThing up for your phone, it is significantly easier. Ensure the above says
            Staged: DeskThing Client and click the gear to open settings.
          </p>
          <p>
            Change the IP to a Local Network and save the settings. Then, go to that ip on your
            phone with the port you entered /client/
          </p>
          <p>It should look something like 192.168.0.1:8891/client/</p>
        </div>
      </div>
      <div className="border-l py-3 mb-5 hover:bg-slate-950 pl-3 border-slate-600 hover:border-slate-400">
        <h1 className="text-2xl font-bold font-geist">Common Problems</h1>
        <div className="pl-3">
          <p className="pl-1">
            Here are some common problems faces when setting up the DeskThing that have a simple or
            easy fix.
          </p>
          <a
            className="underline text-blue-200 hover:text-blue-300"
            href="https://canary.discord.com/channels/1267348109067817051/1273312913205100574"
            target="_blank"
            rel="noreferrer"
          >
            Checkout the full list on discord
          </a>
          <li className="font-semibold">
            Car Thing Not Connecting To DeskThingServer even though it shows the DeskThing logo
          </li>
          <p>
            Sometimes we get lucky. First go to the Client tab and open ADB Socket Port. Then go to
            Client Settings and set the IP to LocalHost. If those two don&apos;t fix it, try using a
            new port on your computer, a new cable, or a different computer. If that doesn&apos;t
            work, join the Discord and I can help further diagnose the issue
          </p>
          <li className="font-semibold">App is not starting!</li>
          <p>
            Try ensuring that all of the requirements for the app are met. Most of the time, this is
            the result of not having Utility installed.
          </p>
        </div>
      </div>
      <p>If there is anything else you would like me to cover here, let me know over discord!</p>
    </div>
  )
}

export default Walkthrough
