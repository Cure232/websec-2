import { useState } from 'react';
import { AppContext } from './AppContextInstance';
export { AppContext } from './AppContextInstance';

export function AppProvider({ children }) {
  const [schedule, setSchedule] = useState([]);

  return (
    <AppContext.Provider value={{ schedule, setSchedule }}>
      {children}
    </AppContext.Provider>
  );
}