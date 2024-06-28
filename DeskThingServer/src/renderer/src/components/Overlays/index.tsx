import AppRequest from './AppRequest'

const Overlays = (): JSX.Element => {
  return (
    <div className="absolute w-full h-full justify-center flex flex-col items-center pointer-events-none">
      <AppRequest />
    </div>
  )
}

export default Overlays
