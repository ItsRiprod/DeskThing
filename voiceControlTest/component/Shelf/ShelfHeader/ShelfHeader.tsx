import { useEffect, useState } from 'react';
import {
  HOME_IDENTIFIER,
  VOICE_IDENTIFIER,
  YOUR_LIBRARY,
} from 'store/ShelfStore';
import {
  IconLibrary32,
  IconHome32,
  IconHomeActive32,
  IconSearch32,
  IconSearchActive,
  IconLibraryActive,
} from 'component/CarthingUIComponents';

import styles from './ShelfHeader.module.scss';
import ShelfHeaderItem, { TitleRef } from './ShelfHeaderItem';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';

export const CATEGORY_ICONS = {
  [HOME_IDENTIFIER]: {
    components: {
      active: <IconHomeActive32 />,
      inactive: <IconHome32 />,
    },
    iconMargin: 10,
  },
  [VOICE_IDENTIFIER]: {
    components: {
      active: <IconSearchActive iconSize={32} />,
      inactive: <IconSearch32 />,
    },
    iconMargin: 8,
  },
  [YOUR_LIBRARY]: {
    components: {
      active: <IconLibraryActive iconSize={32} />,
      inactive: <IconLibrary32 />,
    },
    iconMargin: 6,
  },
};

const ShelfHeader = () => {
  const [titleRefs, setTitleRefs] = useState<TitleRef[]>([]);

  const uiState = useStore().shelfStore.shelfController.headerUiState;

  const numberOfMainCategories = uiState.mainCategoriesCount;
  useEffect(() => {
    setTitleRefs([]);
  }, [uiState.mainCategoriesCount]);

  const addTitleRef = (index: number, ref: TitleRef) => {
    setTitleRefs((existingRefs) => {
      const titleRef = existingRefs[index];
      if (!titleRef) {
        const newRefs = [...existingRefs];
        newRefs[index] = ref;
        return newRefs;
      }
      return existingRefs;
    });
  };

  const getTitleTranslateLeft = (index: number) => {
    return (
      titleRefs
        .slice(0, index)
        .reduce(
          (sum, titleRef) =>
            titleRef.titleTextRef
              ? sum + titleRef.titleTextRef.offsetWidth
              : sum,
          0,
        ) +
      8 * index // Move everything additional 8px left to reduce header margins when Your Library is expanded
    );
  };

  if (!uiState.shouldShowShelfHeader) {
    return null;
  }

  const yourLibTranslateLeft = getTitleTranslateLeft(
    numberOfMainCategories + 1,
  );

  const activeTitleRef = titleRefs[uiState.activeTitleIndex];
  let underlineTranslateX: number;
  if (!activeTitleRef || !activeTitleRef.titleContainerRef) {
    underlineTranslateX = 0;
  } else if (uiState.isInYourLibrary) {
    underlineTranslateX =
      activeTitleRef.titleContainerRef.offsetLeft - yourLibTranslateLeft;
  } else {
    underlineTranslateX = activeTitleRef.titleContainerRef.offsetLeft;
  }

  return (
    <>
      <div className={styles.shelfTitles}>
        {uiState.mainCategories.map((category, index) => (
          <ShelfHeaderItem
            key={category.parsedId}
            id={category.parsedId}
            title={category.title}
            icon={CATEGORY_ICONS[category.parsedId].components}
            iconMargin={CATEGORY_ICONS[category.parsedId].iconMargin}
            marginRight={40}
            visible
            active={uiState.isSelectedItemCategory(category.parsedId)}
            onlyIcon={uiState.isInYourLibrary}
            translateLeft={getTitleTranslateLeft(index)}
            ref={(ref: TitleRef) => addTitleRef(index, ref)}
          />
        ))}
        <ShelfHeaderItem
          id={YOUR_LIBRARY}
          title="Your Library"
          icon={CATEGORY_ICONS[YOUR_LIBRARY].components}
          iconMargin={CATEGORY_ICONS[YOUR_LIBRARY].iconMargin}
          marginRight={40}
          visible
          active={uiState.isInYourLibrary}
          onlyIcon={uiState.isInYourLibrary}
          translateLeft={getTitleTranslateLeft(numberOfMainCategories)}
          ref={(ref: TitleRef) => addTitleRef(numberOfMainCategories, ref)}
        />
        {uiState.yourLibraryCategories.map((category, index) => (
          <ShelfHeaderItem
            key={category.parsedId}
            id={category.parsedId}
            title={category.title}
            marginRight={24}
            visible={uiState.isInYourLibrary}
            active={uiState.isSelectedItemCategory(category.parsedId)}
            translateLeft={yourLibTranslateLeft}
            ref={(ref: TitleRef) =>
              addTitleRef(numberOfMainCategories + index + 1, ref)
            }
          />
        ))}
      </div>

      <div className={styles.titleUnderlineContainer}>
        {activeTitleRef && activeTitleRef.titleContainerRef && (
          <div
            className={styles.titleUnderline}
            style={{
              transform: `translateX(${underlineTranslateX}px) 
                          scaleX(${activeTitleRef.titleContainerRef.offsetWidth})`,
            }}
          />
        )}
      </div>
    </>
  );
};

export default observer(ShelfHeader);
