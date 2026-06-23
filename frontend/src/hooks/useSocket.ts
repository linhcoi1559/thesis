import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  token?: string; // Landlord JWT token for authenticating connection
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
    token,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  // Establish connection to the WebSockets server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Set token in handshake auth properties
    socketRef.current = io(url, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Successfully connected to WebSockets server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSockets server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSockets connection error:', error.message);
    });
  }, [url, token]);

  // Disconnect from the WebSockets server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Safe wrapper to subscribe to incoming server events
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  // Safe wrapper to emit events to the server
  const emit = useCallback((event: string, payload: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, payload);
  }, []);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect, token]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    on,
    emit,
  };
};
