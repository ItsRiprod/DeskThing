import AppRequest from './AppRequest'
import ToastContainer from './ToastContainer'

const Overlays = (): JSX.Element => {
  return (
    <div className="absolute w-full h-full justify-center flex flex-col items-center pointer-events-none">
      <AppRequest />
      <ToastContainer />
    </div>
  )
}

export default Overlays
