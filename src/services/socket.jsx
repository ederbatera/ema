import io from 'socket.io-client'

// const socket = await io.connect('http://localhost:3001')
// const socket = io.connect('http://5.161.71.72:3030')
const socket = io.connect('https://backend.agudos.net', { transports: ['polling'] })

export default socket