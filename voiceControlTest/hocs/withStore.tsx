import { ComponentType } from 'react';
import { RootStoreProps } from 'store/RootStore';
import { useStore } from 'context/store';
import hoistNonReactStatics from 'hoist-non-react-statics';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

const withStore = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithStore = (props: Omit<P, keyof RootStoreProps>) => {
    const store = useStore();
    //@ts-ignore
    return <WrappedComponent {...(props as P)} store={store} />;
  };
  WithStore.displayName = `WithStore(${getDisplayName(WrappedComponent)})`;

  hoistNonReactStatics(WithStore, WrappedComponent);

  return WithStore;
};

export default withStore;
