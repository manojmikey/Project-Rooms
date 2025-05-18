const express = require('express');
const path = require("path");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { user, getRoomModel } = require('./config');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
}));

let rooms = [];

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.on('join room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });
    
    socket.on('chat message', async ({ room, name, message }) => {
        const RoomModel = getRoomModel(room);
        const newMessage = await new RoomModel({ name, message }).save();
        
        io.to(room).emit('chat message', {
            name: newMessage.name,
            message: newMessage.message
        });
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.get("/", (req, res) => {
    res.render("signup");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});


app.post("/signup", async (req, res) => {
    const { name, password } = req.body;
    const userExists = await user.findOne({ name });

    if (userExists) {
        return res.render("signup", { error: "User already exists." });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    await new user({ name, password: hashPassword }).save();
    req.session.username = name;
    res.redirect("/home");
});

app.post("/login", async (req, res) => {
    const { name, password } = req.body;
    const userExists = await user.findOne({ name });

    if (!userExists || !(await bcrypt.compare(password, userExists.password))) {
        return res.send("Invalid credentials");
    }

    req.session.username = name;
    res.redirect("/home");
});

app.get("/home", async (req, res) => {
    const currentRoom = req.query.room;
    if (!req.session.username) return res.redirect('/login');

    let messages = [];
    if (currentRoom) {
        const RoomModel = getRoomModel(currentRoom);
        messages = await RoomModel.find({});
        if (!rooms.includes(currentRoom)) rooms.push(currentRoom);
    }

    res.render("home", {
        username: req.session.username,
        rooms,
        currentRoom,
        messages
    });
});

app.post("/createRoom", (req, res) => {
    const roomName = req.body.room.trim();
    if (roomName && !rooms.includes(roomName)) {
        rooms.push(roomName);
        io.emit('new room', roomName);
    }
    res.redirect(`/home?room=${roomName}`);
});

app.post("/sendMessage", async (req, res) => {
    const { room, message } = req.body;
    const name = req.session.username;

    if (!room || !name) return res.redirect("/home");

    const RoomModel = getRoomModel(room);
    const newMessage = await new RoomModel({ name, message }).save();
    
    io.to(room).emit('chat message', {
        name: newMessage.name,
        message: newMessage.message
    });

    res.redirect(`/home?room=${room}`);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});