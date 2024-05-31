import { useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';
import Type, { TypeName } from 'component/CarthingUIComponents/Type/Type';

export type Props = {
  className?: string;
  textContent: string;
  maxHeight: number; // Height to try and keep within the bounds of. Note that this component will not hide overflow.
  textSizesDescending: TypeName[]; // These Type Names will be tried in order, so they should be provided largest first
  dataTestId: string;
};

const AutoSizingText = ({
  className,
  textContent,
  maxHeight,
  textSizesDescending,
  dataTestId,
}: Props): JSX.Element | null => {
  const [showText, setShowText] = useState(true);
  const [textSizeIndex, setTextSizeIndex] = useState(0);
  // Keeping a copy of the text to be able to compare text div size on rerender.
  const [refText, setRefText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const effect = () => {
      const preRenderDiv = ref.current;
      // If the text content changes, reset and resize
      if (textContent !== refText) {
        setRefText(textContent);
        setShowText(false);
        setTextSizeIndex(0);
      }
      // If we exceed the max text height, see if we can drop down the text size
      if (
        preRenderDiv &&
        preRenderDiv.offsetHeight > maxHeight &&
        textSizeIndex + 1 < textSizesDescending.length
      ) {
        setTextSizeIndex(textSizeIndex + 1);
      } else {
        // If we fit inside the max height or there are no
        // more text sizes to shrink to, show the text
        setShowText(true);
      }
    };
    runInAction(effect);
  }, [
    ref,
    refText,
    textContent,
    textSizeIndex,
    showText,
    maxHeight,
    textSizesDescending,
  ]);

  return showText ? (
    <Type
      name={textSizesDescending[textSizeIndex]}
      className={className}
      dataTestId={dataTestId}
      ref={ref}
    >
      {textContent}
    </Type>
  ) : null;
};

export default AutoSizingText;
