// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addNotification } from '../store/slices/notificationSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useDispatch();
  const { user, accessToken, isAuthenticated } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      if (user?.franchiseId) socket.emit('join:franchise', user.franchiseId);
      if (user?.id) socket.emit('join:user', user.id);
    });

    // Real-time notification events
    socket.on('notification', (payload: { title: string; body: string; type: string }) => {
      dispatch(addNotification({
        id: Date.now().toString(),
        title: payload.title,
        body: payload.body,
        type: payload.type,
        isRead: false,
        createdAt: new Date().toISOString(),
      }));
    });

    socket.on('attendance:update', (data: unknown) => {
      // Invalidate RTK Query cache for attendance
      console.log('[Socket] Attendance updated:', data);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, user?.franchiseId, user?.id]);

  return socketRef.current;
};