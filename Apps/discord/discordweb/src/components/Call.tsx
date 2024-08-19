import { DeskThing } from 'deskthing-client'
import Controls from './Controls'
import discordStore, { userData } from '../stores/discordStore'
import { useEffect, useState } from 'react'
import { IconDeafenedDiscord, IconMicOffDiscord, IconUserCircle } from './icons'

export const Call = () => {
    const [callData, setCallData] = useState<userData[]>(discordStore.getCallData())
    const deskthing = DeskThing.getInstance()
    useEffect(() => {
        const handleCallDataUpdate = (data: userData[]) => {
            setCallData(data)
        }

        const unsubscribe = discordStore.subscribeToCallDataUpdate(handleCallDataUpdate)
        return () => {
            unsubscribe()
        }

    }, [deskthing])

    const getVolumeBorder = (volume: number) => {
        const degree = (volume / 100) * 360;
        return `conic-gradient(green ${degree}deg, transparent ${degree}deg)`;
      };

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className="flex flex-col flex-wrap h-screen justify-around items-center p-4">
                {callData.map((participant) => (
                    <div className={`flex flex-col items-center m-3`}>
                    {participant.profile ? 
                        <div className={`relative w-32 h-32`}>
                            <div
                              className={`absolute flex items-center justify-center inset-0 w-full h-full rounded-full ${participant.speaking ? 'border-4 border-green-500' : 'border-transparent p-1'}`}
                              style={{
                                background: getVolumeBorder(participant.volume ?? 0),
                              }}
                            >
                            <div
                              className={`inset-0 w-full h-full overflow-hidden rounded-full`}
                              style={{
                                backgroundImage: `url(${participant.profile})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                            </div>
                            <div className="absolute right-0 bottom-0 text-red-500 fill-current">
                                {participant.mute && <IconMicOffDiscord />}
                                {participant.deaf && <IconDeafenedDiscord />}
                            </div>
                        </div>
                        :
                        <IconUserCircle iconSize={128} className="bg-green-500 rounded-full" />
                    }
                    <div className="user-info">
                        <h2 className="font-semibold text-white">{participant.nick || participant.username}</h2>
                    </div>
                </div>
                ))}
            </div>
            <Controls />
        </div>
    )
}
