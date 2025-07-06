import React from 'react'

const SuperbirdPage: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="p-8 text-3xl font-bold text-white">Car Thing Flashing</h1>
      <div className="mx-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <p className="text-white">
          This feature will be implemented in a future version of DeskThing. For now, please use{' '}
          <a
            href="https://terbium.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            https://terbium.app
          </a>{' '}
          instead.
        </p>
      </div>
    </div>
  )
}

export default SuperbirdPage
