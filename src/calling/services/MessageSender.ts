import io, {Socket} from 'socket.io-client';
import {getData} from '../../hooks/useAsyncStorage';
import {SOCKET_SERVER_URL} from '../../api/axiosInstance';
import {MsgDataType} from '../../utils/typescriptInterfaces';

let socket: Socket | null = null;
let currentUserId: string | null = null;
let initializing: Promise<Socket> | null = null;

/** Wait for a single event (connect) with timeout */
const waitFor = (
  emitter: {once: (ev: string, cb: (...a: any[]) => void) => any},
  event: string,
  timeoutMs = 10000,
) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}"`)),
      timeoutMs,
    );
    emitter.once(event, () => {
      clearTimeout(t);
      resolve();
    });
  });

/** Ensure a connected socket and emit 'register' (no ack expected) */
export const initChatSocket = async (userId: string): Promise<Socket> => {
  if (!userId) throw new Error('initChatSocket: userId required');

  if (socket && socket.connected && currentUserId === userId) return socket;
  if (initializing) return initializing;

  initializing = (async () => {
    currentUserId = userId;

    if (socket) {
      try {
        socket.off();
        socket.disconnect();
      } catch {}
      socket = null;
    }

    const token = await getData('authToken');

    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      query: {userId}, // your backend expects userId here as well
      auth: {token}, // send token in handshake (safe to keep)
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    });

    socket.on('connect', () => {
      // console.log('[MessageSender] connect', {id: socket?.id});
      // 🔑 Backend expects: register(userObjId, jwt token)
      socket?.emit('register', userId, token);
    });

    socket.on('reconnect', attempt => {
      // console.log('[MessageSender] reconnect', {attempt});
      socket?.emit('register', userId, token);
    });

    socket.on('connect_error', err => {
      // console.log('[MessageSender] connect_error', err?.message || err);
    });

    socket.on('error', err => {
      // console.log('[MessageSender] error', err);
    });

    if (!socket.connected) {
      await waitFor(socket, 'connect', 10000);
    }

    // small grace so server processes register (optional)
    await new Promise(r => setTimeout(r, 120));

    return socket!;
  })();

  try {
    return await initializing;
  } finally {
    initializing = null;
  }
};

/** Send a chat message from anywhere (no ack) */
export const sendChatMessage = async (args: {
  senderId: string;
  receiverId: string;
  text?: string;
  attachments?: NonNullable<MsgDataType['attachments']>;
  contact?: MsgDataType['contact'];
  location?: MsgDataType['location'];
}) => {
  const {senderId, receiverId, text, attachments, contact, location} = args;
  if (!senderId || !receiverId)
    throw new Error('sendChatMessage: senderId and receiverId are required');

  const s = await initChatSocket(senderId);

  const payload: MsgDataType = {
    sender: senderId,
    receiver: receiverId,
    text: text?.trim() ?? '',
    ...(attachments && attachments.length ? {attachments} : {}),
    ...(contact ? {contact} : {}),
    ...(location ? {location} : {}),
  };

  s.emit('sendMessage', payload);
  console.log('[MessageSender] sendMessage emitted', payload);
};

/** Optional listeners/utilities */
export const addIncomingMessageListener = (cb: (msg: any) => void) => {
  if (!socket) return;
  socket.on('getMessage', cb);
};

export const disconnectChatSocket = () => {
  if (socket) {
    try {
      socket.off();
      socket.disconnect();
    } catch {}
    socket = null;
    currentUserId = null;
  }
};
