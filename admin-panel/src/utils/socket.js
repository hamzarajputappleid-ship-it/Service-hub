import { io as socketIO } from 'socket.io-client'

let socket = null

export function getSocket(token) {
  if (!socket || !socket.connected) {
    socket = socketIO('http://localhost:5000', {
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
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
