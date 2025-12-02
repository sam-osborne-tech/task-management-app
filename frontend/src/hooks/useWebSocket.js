import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : '');

export function useWebSocket(onTaskCreated, onTaskUpdated, onTaskDeleted, onBulkDeleted, onBulkUpdated) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('WebSocket connection error:', error.message);
      setConnected(false);
    });

    // Task events
    socketRef.current.on('task:created', (task) => {
      console.log('Task created via WebSocket:', task);
      onTaskCreated?.(task);
    });

    socketRef.current.on('task:updated', (task) => {
      console.log('Task updated via WebSocket:', task);
      onTaskUpdated?.(task);
    });

    socketRef.current.on('task:deleted', ({ id }) => {
      console.log('Task deleted via WebSocket:', id);
      onTaskDeleted?.(id);
    });

    socketRef.current.on('tasks:bulk-deleted', ({ ids }) => {
      console.log('Tasks bulk deleted via WebSocket:', ids);
      onBulkDeleted?.(ids);
    });

    socketRef.current.on('tasks:bulk-updated', ({ tasks }) => {
      console.log('Tasks bulk updated via WebSocket:', tasks);
      onBulkUpdated?.(tasks);
    });
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, onBulkDeleted, onBulkUpdated]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connected, connect, disconnect };
}

export default useWebSocket;

