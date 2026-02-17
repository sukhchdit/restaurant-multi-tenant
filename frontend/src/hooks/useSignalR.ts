import { useEffect, useRef, useCallback } from 'react';
import { signalRService } from '@/services/signalr/signalRService';
import type { HubConnection } from '@microsoft/signalr';

type Handler = (...args: unknown[]) => void;

export const useSignalR = (hubName: string, enabled: boolean = true) => {
  const connectionRef = useRef<HubConnection | null>(null);
  const pendingRef = useRef<Map<string, Set<Handler>>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const connect = async () => {
      try {
        const connection = await signalRService.connect(hubName);
        connectionRef.current = connection;

        // Apply any handlers that were registered before the connection was ready
        pendingRef.current.forEach((callbacks, event) => {
          callbacks.forEach((cb) => connection.on(event, cb));
        });
        pendingRef.current.clear();
      } catch (error) {
        console.error(`Failed to connect to ${hubName} hub:`, error);
      }
    };

    connect();

    return () => {
      connectionRef.current = null;
      pendingRef.current.clear();
      signalRService.disconnect(hubName);
    };
  }, [hubName, enabled]);

  const on = useCallback((event: string, callback: Handler) => {
    const connection = connectionRef.current;
    if (connection) {
      connection.on(event, callback);
    } else {
      // Connection not ready yet — queue the handler
      if (!pendingRef.current.has(event)) {
        pendingRef.current.set(event, new Set());
      }
      pendingRef.current.get(event)!.add(callback);
    }

    return () => {
      connectionRef.current?.off(event, callback);
      pendingRef.current.get(event)?.delete(callback);
    };
  }, []);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    const connection = connectionRef.current;
    if (connection) {
      return connection.invoke(method, ...args);
    }
  }, []);

  return { on, invoke, connection: connectionRef.current };
};
