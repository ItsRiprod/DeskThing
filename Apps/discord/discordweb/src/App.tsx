import { Call } from './components/Call'
import Deskthing from 'deskthing-app-server'

function App() {
  const deskthing = new Deskthing()

  deskthing.setVal(2)
  deskthing.printVal()

  return (
    <div className="bg-zinc-900 h-screen w-screen flex justify-center items-center">
        <Call />
    </div>
  );
}

export default App;
