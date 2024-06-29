import { useEffect } from 'react'
import { IconCarThing } from './icons'

const Status = (): JSX.Element => {
  useEffect(() => {
    console.log('apps list in AppsList: ')
  }, [])

  return (
    <div className="pt-5 flex justify-center">
      <IconCarThing
        iconSize={350}
        fontSize={70}
        text={'Status: Unimplemented'}
        highlighted={[]}
        highlightColor="yellow"
      />
    </div>
  )
}

export default Status
