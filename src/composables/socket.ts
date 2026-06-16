import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const serverIP = sessionStorage.getItem("serverIP") || "http://localhost:3000";
export function connectSocket(token: string) {
  if (socket) {
    socket.disconnect();
  }
    if (!token) {
        console.error("No auth token found in local storage.");
        return;
    }
  socket = io(serverIP, {
    auth: { token },
    transports: ['websocket']
  });

  console.log("Socket connected to server:", serverIP);
  return socket;
}

export function getSocket(): Socket {
    if (!socket){
        socket = io(serverIP);
    }
    return socket;
  }
  
