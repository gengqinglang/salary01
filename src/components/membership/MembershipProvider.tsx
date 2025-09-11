import React, { createContext, useContext, useState } from 'react';

interface MembershipContextType {
  isMember: boolean;
  isDevMode: boolean;
  setMembershipStatus: (status: boolean, type?: string) => void;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};

interface MembershipProviderProps {
  children: React.ReactNode;
}

export const MembershipProvider: React.FC<MembershipProviderProps> = ({ children }) => {
  const [isMember, setIsMember] = useState(false);
  const [isDevMode] = useState(false);

  const setMembershipStatus = (status: boolean, type?: string) => {
    setIsMember(status);
  };

  return (
    <MembershipContext.Provider value={{
      isMember,
      isDevMode,
      setMembershipStatus
    }}>
      {children}
    </MembershipContext.Provider>
  );
};