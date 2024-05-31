import { useEffect, useRef, useState } from 'react';
import styles from './Licenses.module.scss';
import Spinner, {
  SpinnerSize,
} from 'component/CarthingUIComponents/Spinner/Spinner';
import { useStore } from 'context/store';
import { VariableSizeList } from 'react-window';
import { Type } from 'component/CarthingUIComponents';

const UI_LICENSE_FILEPATH = 'license/ui-license.txt';
const MW_LICENSE_FILEPATH = 'license/mw-license.txt';
const OS_LICENSE_FILEPATH = 'license/os-license.txt';

const LINE_HEIGHT = parseInt(styles['line-height'], 10);

function parseFileContents(fileAsString: string): string[] {
  return fileAsString.split('\n').map((line) => (line === '' ? '\n' : line));
}

const Licenses = () => {
  const [allLicenseLines, setAllLicenseLines] = useState<string[]>([]);
  const mountedRef = useRef<boolean>(false);

  const {
    ubiLogger: { settingsUbiLogger },
  } = useStore();

  useEffect(
    () => settingsUbiLogger.logThirdPartyLicenseImpression(),
    [settingsUbiLogger],
  );

  useEffect(() => {
    mountedRef.current = true;

    async function fetchLicenses() {
      const filePromises = await Promise.all([
        fetch(UI_LICENSE_FILEPATH),
        fetch(MW_LICENSE_FILEPATH),
        fetch(OS_LICENSE_FILEPATH),
      ]);
      const [uiLicense, mwLicense, osLicense] = await Promise.all(
        filePromises.map((filePromise) => filePromise.text()),
      );
      if (mountedRef.current) {
        setAllLicenseLines([
          ...parseFileContents(uiLicense),
          ...parseFileContents(mwLicense),
          ...parseFileContents(osLicense),
        ]);
      }
    }
    fetchLicenses();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  function getItemHeight(itemIndex: number): number {
    // The content width of this view after padding is 716. In monospaced font
    // at 12px, this allows for roughly 98 characters per line.
    // The height of each item "row" should be calculated by the line length,
    // this 98 chars, and the line height.
    const charsPerLine = 98;
    return (
      Math.ceil(allLicenseLines[itemIndex].length / charsPerLine) * LINE_HEIGHT
    );
  }

  return (
    <div className={styles.licenses}>
      <Type name="altoBold" className={styles.header}>
        Third-party licenses
      </Type>
      {allLicenseLines.length ? (
        <VariableSizeList
          height={300}
          width="100%"
          itemCount={allLicenseLines.length}
          itemSize={getItemHeight}
          itemData={allLicenseLines}
          className={styles.textAsList}
        >
          {({ index, style, data }) => (
            <div style={{ ...style, wordBreak: 'break-all' }}>
              {data[index]}
            </div>
          )}
        </VariableSizeList>
      ) : (
        <Spinner size={SpinnerSize.BIG} />
      )}
    </div>
  );
};

export default Licenses;
