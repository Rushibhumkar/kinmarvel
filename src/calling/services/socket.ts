import {io} from 'socket.io-client';
import {SOCKET_SERVER_URL} from '../../api/axiosInstance';

const socket = io(SOCKET_SERVER_URL, {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  timeout: 10000,
  autoConnect: false,
});

export default socket;
