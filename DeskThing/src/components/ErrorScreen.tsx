import React, { useEffect } from 'react'

interface ErrorScreenProps {
  message: string
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message }) => {
    useEffect(() => {
      // Set up the interval to refresh the page every 30 seconds
      const timer = setInterval(() => {
        window.location.reload()
      }, 30000) // 30000 milliseconds = 30 seconds  
      // Clear the interval when the component unmounts
      return () => clearInterval(timer)
    }, [])

    return (
        <div className="bg-zinc-800 w-screen h-screen flex justify-center items-center">
            <div className='text-white font-geist'>
                <h1 className="text-4xl text-red-300">Oops! Something went wrong.</h1>
                <p className="font-geistMono">{message}</p>
                <div className="w-full flex justify-center pt-5">
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-5 justify-self-center border-sky-400 border rounded-lg hover:bg-sky-400 hover:text-black"
                    >Refresh Page</button>
                </div>
            </div>
        </div>
  )
}

export default ErrorScreen
