import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Singleton socket — one connection shared across the whole app
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socketInstance;
};

/**
 * useSocket(jobId, handlers)
 *
 * Joins the given jobId room and binds event handlers.
 * Automatically leaves the room on cleanup.
 *
 * @param {string|null} jobId - The job ID to listen to (or null to skip)
 * @param {{ onProgress, onDone, onFailed }} handlers
 */
export function useSocket(jobId, { onProgress, onDone, onFailed } = {}) {
  const socket = getSocket();
  const handlersRef = useRef({ onProgress, onDone, onFailed });

  // Keep handlers ref fresh without re-running the effect
  useEffect(() => {
    handlersRef.current = { onProgress, onDone, onFailed };
  });

  useEffect(() => {
    if (!jobId) return;

    const handleProgress = (data) => handlersRef.current.onProgress?.(data);
    const handleDone = (data) => handlersRef.current.onDone?.(data);
    const handleFailed = (data) => handlersRef.current.onFailed?.(data);

    socket.emit('join-job', { jobId });
    socket.on('job:progress', handleProgress);
    socket.on('job:done', handleDone);
    socket.on('job:failed', handleFailed);

    return () => {
      socket.emit('leave-job', { jobId });
      socket.off('job:progress', handleProgress);
      socket.off('job:done', handleDone);
      socket.off('job:failed', handleFailed);
    };
  }, [jobId]);
}
