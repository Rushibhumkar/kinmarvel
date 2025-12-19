import React, {createContext, useContext} from 'react';
import {useCall} from '../hooks/useCall';

const CallContext = createContext<any>(null);

export const CallProvider = ({userId, children}: any) => {
  const call = useCall(userId);
  return <CallContext.Provider value={call}>{children}</CallContext.Provider>;
};

export const useCallContext = () => useContext(CallContext);
