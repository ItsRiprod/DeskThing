import { observer } from 'mobx-react-lite';
import StartSetup from './StartSetup';
import Connected from './Connected';
import BTPairing from './BTPairing';
import Welcome from './Welcome';
import Updating from './Updating';
import Failed from './Failed';
import Waiting from './Waiting';
import { SetupView } from 'store/SetupStore';
import { useStore } from 'context/store';

const viewToComp = {
  [SetupView.WELCOME]: <Welcome />,
  [SetupView.START_SETUP]: <StartSetup />,
  [SetupView.BT_PAIRING]: <BTPairing />,
  [SetupView.CONNECTED]: <Connected />,
  [SetupView.UPDATING]: <Updating />,
  [SetupView.FAILED]: <Failed />,
  [SetupView.WAITING]: <Waiting />,
};

const Setup = () => {
  const { setupStore } = useStore();

  return viewToComp[setupStore.currentStep];
};

export default observer(Setup);
