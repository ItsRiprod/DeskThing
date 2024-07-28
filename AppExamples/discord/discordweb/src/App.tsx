import IframeComponent from './IframeComponent';
import { Call } from './components/Call'

function App() {
  return (
    <div className="bg-zinc-900 h-screen w-screen flex justify-center items-center">
      <IframeComponent>
        <Call />
      </IframeComponent>
    </div>
  );
}

export default App;
