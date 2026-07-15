const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_board', (boardId) => {
        socket.join(`board_${boardId}`);
        console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.post('/broadcast', (req, res) => {
    const { boardId, event, payload } = req.body;
    io.to(`board_${boardId}`).emit(event, payload);
    res.send({ status: 'ok' });
});

server.listen(3001, () => {
    console.log('Realtime server running on http://localhost:3001');
});