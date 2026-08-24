import { io, Socket } from 'socket.io-client';
import { getServerUrl } from './api';
import { clearSession } from './session';

let socket: Socket | null = null;

function getServerIP() {
  return getServerUrl();
}

function createSocket(token?: string) {
  const createdSocket = io(getServerIP(), {
    auth: token ? { token } : undefined,
    // Polling is an important fallback on networks/proxies that block WebSockets.
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
  });

  createdSocket.on('connect', () => window.dispatchEvent(new Event('connection-restored')));
  createdSocket.on('connect_error', () => window.dispatchEvent(new Event('connection-lost')));
  createdSocket.on('disconnect', () => window.dispatchEvent(new Event('connection-lost')));
  createdSocket.on('auth-error', () => {
    clearSession();
    createdSocket.disconnect();
    window.dispatchEvent(new Event('auth-expired'));
  });
  return createdSocket;
}

export function connectSocket(token: string): Socket | undefined {
  if (socket) {
    socket.disconnect();
  }
  if (!token) {
    console.error("No auth token found in session storage.");
    return;
  }

  sessionStorage.setItem("authToken", token);
  window.dispatchEvent(new Event('auth-state-changed'));
  socket = createSocket(token);

  console.log("Socket connected to server:", getServerIP());
  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    const token = sessionStorage.getItem("authToken") || undefined;
    socket = createSocket(token);
    console.log("Socket connected to server:", getServerIP());
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function restoreSocket(): Socket | undefined {
  const token = sessionStorage.getItem('authToken');
  if (!token) return;
  return getSocket();
}
