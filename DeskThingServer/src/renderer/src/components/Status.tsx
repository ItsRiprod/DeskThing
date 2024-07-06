import { useEffect } from 'react'
import { IconCarThing } from './icons'

const Status = (): JSX.Element => {
  useEffect(() => {
    console.log('apps list in AppsList: ')
  }, [])

  return (
    <div className="pt-5 flex-col justify-center">
      <IconCarThing
        iconSize={350}
        fontSize={70}
        text={'Status: Unimplemented'}
        highlighted={[]}
        highlightColor="yellow"
      />
      <p>
        No but actually, this hasn&apos;t been implemented yet. <br /> Stop waiting for it to
        connect
      </p>
    </div>
  )
}

export default Status
