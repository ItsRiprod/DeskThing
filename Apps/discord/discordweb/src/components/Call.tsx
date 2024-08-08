import messageStore from '../stores/messageStore'
import Controls from './Controls'
import Profile from './Profile'
import discordStore, { userData } from '../stores/discordStore'
import { useEffect, useState } from 'react'

export const Call = () => {
    const [callData, setCallData] = useState<userData[]>([])

    useEffect(() => {
        messageStore.sendMessageToParent('server', 'message', 'message', 'Helloooooo')
        const handleCallDataUpdate = (data: userData[]) => {
            setCallData(data)
            console.log('Callback data',data)
        }

        const unsubscribe = discordStore.subscribeToCallDataUpdate(handleCallDataUpdate)
        return () => {
            unsubscribe()
        }

    }, [])

    useEffect(() => {
        console.log('Current call data:', callData)
    }, [callData])

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className="flex-1 overflow-y-auto p-4">
                {callData.map((participant) => (
                    <Profile key={participant.id} data={participant} />
                ))}
            </div>
            <Controls />
        </div>
    )
}
