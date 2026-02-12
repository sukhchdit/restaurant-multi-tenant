import { useEffect, useRef, useCallback } from 'react';
import { signalRService } from '@/services/signalr/signalRService';
import type { HubConnection } from '@microsoft/signalr';

export const useSignalR = (hubName: string) => {
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        connectionRef.current = await signalRService.connect(hubName);
      } catch (error) {
        console.error(`Failed to connect to ${hubName} hub:`, error);
      }
    };

    connect();

    return () => {
      signalRService.disconnect(hubName);
    };
  }, [hubName]);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    const connection = connectionRef.current;
    if (connection) {
      connection.on(event, callback);
      return () => connection.off(event, callback);
    }
    return () => {};
  }, []);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    const connection = connectionRef.current;
    if (connection) {
      return connection.invoke(method, ...args);
    }
  }, []);

  return { on, invoke, connection: connectionRef.current };
};
