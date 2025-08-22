import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <Wifi className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-600 font-medium">Disconnected</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;