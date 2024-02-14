import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
//const URL = process.env.NODE_ENV === 'production' ? undefined : 'https://socket.agudos.digital';

export const socket = io('https://ws.agudos.net', {transports: ['polling']});
//export const socket = io('http://10.100.0.104:3030', {transports: ['polling']});