import React, { useEffect, useRef, useState } from 'react'
import { IconCallDiscord, IconDeafenedDiscord, IconDeafenedOffDiscord, IconMicDiscord, IconMicOffDiscord } from './icons';

interface ControlsProps {
    // Define your props here
}

const Controls: React.FC<ControlsProps> = () => {
    const discordIslandRef = useRef<HTMLDivElement>(null);
    const [muted, setMuted] = useState(false);
    const [deafened, setDeafened] = useState(false);
    const [touched, setTouched] = useState(false);
    
    const handleTouchOutside = (event: TouchEvent) => {
        if (discordIslandRef.current && !discordIslandRef.current.contains(event.target as Node)) {
            setTouched(false);
        }
    };

    const handleTouchInside = () => {
        if (discordIslandRef.current) {
            setTouched(true)
        }
    };
    useEffect(() => {
        document.addEventListener('touchstart', handleTouchOutside);
        return () => {
            document.removeEventListener('touchstart', handleTouchOutside);
        };
    }, []);

    const handleMic = () => {
        setMuted((old) => !old);
    }
    const handleDeaf = () => {
        setDeafened((old) => !old);
    }
    return (
        <div className={`fixed border-2 rounded-full bottom-10 left-10 overflow-hidden transition-all duration-300 ${touched ? 'w-72' : 'w-20 '}`}
        ref={discordIslandRef}
            onTouchStart={handleTouchInside}>
            <div className="flex p-3 flex-nowrap justify-evenly">
                <button onClick={handleMic}>
                    {muted ?
                        <IconMicOffDiscord iconSize={60} className={'fill-current stroke-current text-red-500'} />
                        :
                        <IconMicDiscord iconSize={60} className={'fill-current stroke-current text-indigo-900'} />
                    }
                </button>
                <button onClick={handleDeaf}>
                    {deafened ?
                        <IconDeafenedDiscord iconSize={60} className={'fill-current text-red-700'} />
                        :
                        <IconDeafenedOffDiscord iconSize={60} className={'fill-current stroke-current text-indigo-900'} />
                    }
                </button>
                <button onClick={handleMic}>
                    <IconCallDiscord iconSize={60} className={'fill-current stroke-current text-red-700'} />
                </button>
            </div>
        </div>
    )
}

export default Controls
