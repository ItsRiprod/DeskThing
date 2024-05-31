import { observer } from 'mobx-react-lite';
import Listening from 'component/Listening/Listening';
import { useStore } from 'context/store';
import Overlay, { FROM } from 'component/Overlays/Overlay';

const Overlays = () => {
  const { overlayController } = useStore();

  return (
    <>
      <Overlay
        appear={FROM.FADE_IN}
        show={overlayController.isShowing('voice')}
      >
        <Listening />
      </Overlay>
    </>
  );
};

export default observer(Overlays);
