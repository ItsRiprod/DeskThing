export function convertMouseToTouch(element) {
    const mouseToTouch = (type, originalEvent) => {
      const touchEvent = new TouchEvent(type, {
        touches: [new Touch({
          identifier: Date.now(),
          target: originalEvent.target,
          clientX: originalEvent.clientX,
          clientY: originalEvent.clientY,
          screenX: originalEvent.screenX,
          screenY: originalEvent.screenY,
          pageX: originalEvent.pageX,
          pageY: originalEvent.pageY,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 1,
        })],
        targetTouches: [],
        changedTouches: [],
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      originalEvent.target.dispatchEvent(touchEvent);
      originalEvent.preventDefault();
    };
  
    const handleMouseMove = (e) => mouseToTouch('touchmove', e);
  
    element.addEventListener('mousedown', (e) => {
      mouseToTouch('touchstart', e);
      element.addEventListener('mousemove', handleMouseMove);
    });
  
    element.addEventListener('mouseup', (e) => {
      mouseToTouch('touchend', e);
      element.removeEventListener('mousemove', handleMouseMove);
    });
  }