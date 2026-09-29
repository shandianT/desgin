import React, {useSyncExternalStore} from 'react';
import {flushSync} from 'react-dom';
import {ConfigProvider} from 'antd';

const suspended = {focusable: {trap: false, focusTriggerAfterClose: false}};
const getSnapshot = () => Boolean(globalThis.SalesRuntime?.nativeModalOpen);
const subscribe = listener => {
  // Release the underlying AntD lock before the native modal first receives focus.
  const changed = () => flushSync(listener);
  window.addEventListener('sales-native-modal-change', changed);
  return () => window.removeEventListener('sales-native-modal-change', changed);
};

export default function NativeModalFocusBoundary({children}) {
  const open = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return <ConfigProvider modal={open ? suspended : undefined} drawer={open ? suspended : undefined}>{children}</ConfigProvider>;
}
