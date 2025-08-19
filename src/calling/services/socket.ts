import {io} from 'socket.io-client';
import {SOCKET_SERVER_URL} from '../../api/axiosInstance';

// One shared socket instance
const socket = io(SOCKET_SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false, // App.tsx will control connect/disconnect
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 15000,
  forceNew: false,
});

// ---- Helpers (optional, keeps existing default export intact) ----
export const connectSocket = (token?: string, userId?: string) => {
  // attach auth each time before connect (socket.io v4)
  socket.auth = {token, userId};
  if (!socket.connected && socket.disconnected) socket.connect();
  return new Promise<typeof socket>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const onErr = (err: any) => {
      cleanup();
      reject(err);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('socket connect timeout'));
    }, 20000);
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onErr);
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onErr);
  });
};

export const registerSelf = (userId: string, token?: string) =>
  new Promise<void>(resolve => {
    // ack pattern is optional; keep event signature compatible with your server
    socket.emit('register', userId, token, () => resolve());
  });

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const isSocketConnected = () => socket.connected;

export default socket;
