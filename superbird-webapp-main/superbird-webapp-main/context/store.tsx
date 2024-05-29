import { createContext, PropsWithChildren, useContext } from 'react';
import { RootStore, RootStoreProps } from 'store/RootStore';

export const StoreContext = createContext<RootStore>({} as RootStore);

const StoreProvider = ({
  store,
  children,
}: PropsWithChildren<RootStoreProps>) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): RootStore => useContext(StoreContext);

export default StoreProvider;
