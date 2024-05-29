export default (callback: (isPressed: boolean) => void) => {
  return {
    onTouchStart: () => callback(true),
    onMouseDown: () => callback(true),
    onTouchCancel: () => callback(false),
    onTouchEnd: () => callback(false),
    onMouseUp: () => callback(false),
  };
};
