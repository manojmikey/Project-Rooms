require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Rooms:Rooms25@cluster0.if6uvcn.mongodb.net/Rooms?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("Connection Error", err));


// Schema Definitions
const userSchema = new mongoose.Schema({
    name: String,
    password: String,
});

const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
});

const user = mongoose.model("User", userSchema);

// Room models cache
const roomModels = {};

// Get or create a Mongoose model for a given room
function getRoomModel(roomName) {
    if (!roomModels[roomName]) {
        roomModels[roomName] = mongoose.model(roomName, messageSchema, roomName);
    }
    return roomModels[roomName];
}

module.exports = { user, getRoomModel };