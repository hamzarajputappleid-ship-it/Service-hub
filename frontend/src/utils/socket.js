import { io as socketIO } from 'socket.io-client'

let socket = null

export function getSocket(token) {
  if (!socket) {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socket = socketIO(BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id)
    })
    socket.on('connect_error', (err) => {
      console.warn('Socket.IO error:', err.message)
    })
  } else {
    socket.auth = { token }
    if (!socket.connected) {
      socket.connect()
    }
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
