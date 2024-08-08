import React, { useEffect, useState } from 'react'
import { userData } from '../stores/discordStore'
import { IconUserCircle } from './icons';

interface ProfileProps {
    data: userData;
  }

const Profile: React.FC<ProfileProps> = ({ data }): JSX.Element => {
    const [user, setUser] = useState<userData>(data)

    useEffect(() => {
        setUser(data)
    }, [data])

    return (
        <div className="profile">
            <IconUserCircle iconSize={128} className="bg-green-500 rounded-full" />
            <img src={user.profile || 'default-avatar.png'} alt={user.username} className="border rounded-full" />
            <div className="user-info">
                <h2>{user.nick || user.username}</h2>
                <p>User ID: {user.id}</p>
                {user.channel_id && <p>Channel ID: {user.channel_id}</p>}
                {user.speaking !== undefined && <p>Speaking: {user.speaking ? 'Yes' : 'No'}</p>}
                {user.muted !== undefined && <p>Muted: {user.muted ? 'Yes' : 'No'}</p>}
                {user.state && <p>State: {user.state}</p>}
            </div>
        </div>
    )
}

export default Profile

