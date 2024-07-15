import FileHandler from '../FileHandler'

export type View = 'apps' | 'local' | 'web'

const index = (): JSX.Element => {
  return (
    <>
      <div className="h-full w-[100%] flex flex-col justify-between items-center">
        <FileHandler />
      </div>
    </>
  )
}

export default index
