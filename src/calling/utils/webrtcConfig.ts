const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'turn:fameely-api.deliciousdabbas.com:3478',
      username: 'fameely',
      credential: 'fameely@12345',
    },
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

export default ICE_SERVERS;
