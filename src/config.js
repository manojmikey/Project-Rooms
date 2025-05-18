const mongoose = require('mongoose');

// Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/chatbox', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
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