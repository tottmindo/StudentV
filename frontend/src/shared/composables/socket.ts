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
  createdSocket.on('disconnect', reason => {
    // socket.disconnect() is an intentional local shutdown and Socket.IO will
    // not reconnect it. Do not present that state as a network interruption.
    if (reason !== 'io client disconnect') {
      window.dispatchEvent(new Event('connection-lost'));
    }
  });
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
  // Temporary accounts may call only the account-completion endpoint. Opening
  // a socket here would correctly be rejected by the server and could be
  // mistaken by the client for an expired login.
  if (!token || sessionStorage.getItem('mustChangePassword') === 'true') return;
  return getSocket();
}
