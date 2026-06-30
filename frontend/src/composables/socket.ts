import { io, Socket } from 'socket.io-client';
import { getServerUrl } from './api';

let socket: Socket | null = null;

function getServerIP() {
  return getServerUrl();
}

function createSocket(token?: string) {
  return io(getServerIP(), {
    auth: token ? { token } : undefined,
    transports: ['websocket']
  });
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
