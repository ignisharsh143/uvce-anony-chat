const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow connections from any origin
        methods: ["GET", "POST"]
    }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anony-chat';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('📦 Connected to MongoDB successfully!');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.log('💡 Make sure MongoDB is running locally or provide a MONGODB_URI environment variable');
});

// Message Schema
const messageSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    reactions: {
        like: [String], // Store users who liked
        heart: [String]  // Store users who hearted
    },
    reported: {
        type: Boolean,
        default: false
    },
    reportedBy: [{
        user: String,
        reportedAt: { type: Date, default: Date.now }
    }]
});

// Auto-delete messages older than 24 hours
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 }); // 24 hours = 86400 seconds

const Message = mongoose.model('Message', messageSchema);

// In-memory storage for active users
let connectedUsers = new Map();

// Helper function to get messages from last 24 hours
async function getRecentMessages() {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const messages = await Message.find({
            timestamp: { $gte: oneDayAgo },
            reported: false
        }).sort({ timestamp: 1 }).limit(100); // Limit to last 100 messages for performance
        
        return messages;
    } catch (error) {
        console.error('Error fetching recent messages:', error);
        return [];
    }
}

io.on('connection', async (socket) => {
    console.log('A user connected');
    
    // Update user count
    const userCount = connectedUsers.size + 1;
    io.emit('user count', userCount);

    // Send recent chat history to new user
    try {
        const recentMessages = await getRecentMessages();
        socket.emit('chat history', recentMessages);
        console.log(`Sent ${recentMessages.length} recent messages to new user`);
    } catch (error) {
        console.error('Error sending chat history:', error);
    }

    // Handle user joining
    socket.on('user joined', (username) => {
        connectedUsers.set(socket.id, {
            username: username,
            joinedAt: new Date()
        });
        
        console.log(`${username} joined the chat`);
        io.emit('user count', connectedUsers.size);
    });

    // Handle identity changes
    socket.on('user identity changed', (newUsername) => {
        if (connectedUsers.has(socket.id)) {
            connectedUsers.get(socket.id).username = newUsername;
            console.log(`User changed identity to ${newUsername}`);
        }
    });

    // Handle new messages
    socket.on('chat message', async (data) => {
        try {
            const newMessage = new Message({
                user: data.user,
                text: data.text,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                reactions: { like: 0, heart: 0 },
                reported: false
            });
            
            const savedMessage = await newMessage.save();
            
            // Broadcast message to all clients with MongoDB _id
            const messageData = {
                id: savedMessage._id.toString(),
                user: savedMessage.user,
                text: savedMessage.text,
                timestamp: savedMessage.timestamp.toISOString(),
                reactions: savedMessage.reactions,
                reported: savedMessage.reported
            };
            
            io.emit('chat message', messageData);
            console.log(`Message saved to DB from ${data.user}: ${data.text.substring(0, 50)}...`);
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle reactions
    socket.on('add reaction', async (data) => {
        const { messageId, reaction, user } = data;
        
        try {
            const message = await Message.findById(messageId);
            if (message && message.reactions[reaction]) {
                // Add user to reaction array if not already present
                if (!message.reactions[reaction].includes(user)) {
                    message.reactions[reaction].push(user);

                    // Also remove from the other reaction if present
                    const otherReaction = reaction === 'like' ? 'heart' : 'like';
                    const userIndex = message.reactions[otherReaction].indexOf(user);
                    if (userIndex > -1) {
                        message.reactions[otherReaction].splice(userIndex, 1);
                    }

                    await message.save();
                }

                // Emit updates for both reactions
                io.emit('reaction updated', {
                    messageId,
                    reaction: 'like',
                    count: message.reactions.like.length,
                    users: message.reactions.like
                });
                io.emit('reaction updated', {
                    messageId,
                    reaction: 'heart',
                    count: message.reactions.heart.length,
                    users: message.reactions.heart
                });
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    });

    socket.on('remove reaction', async (data) => {
        const { messageId, reaction, user } = data;
        
        try {
            const message = await Message.findById(messageId);
            if (message && message.reactions[reaction]) {
                const userIndex = message.reactions[reaction].indexOf(user);
                if (userIndex > -1) {
                    message.reactions[reaction].splice(userIndex, 1);
                    await message.save();
                }
                
                io.emit('reaction updated', {
                    messageId,
                    reaction,
                    count: message.reactions[reaction].length,
                    users: message.reactions[reaction]
                });
            }
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    });

    // Handle message reporting
    socket.on('report message', async (data) => {
        const { messageId, reporter } = data;
        
        try {
            const message = await Message.findById(messageId);
            if (message && !message.reported) {
                // Add reporter to the reportedBy array
                message.reportedBy.push({
                    user: reporter,
                    reportedAt: new Date()
                });
                
                // Mark as reported if this is the first report
                if (message.reportedBy.length === 1) {
                    message.reported = true;
                }
                
                await message.save();
                
                console.log(`Message ${messageId} reported by ${reporter}`);
                console.log(`Reported message content: "${message.text}"`);
                console.log(`Total reports: ${message.reportedBy.length}`);
                
                // Notify the reporter that the report was received
                socket.emit('message reported', messageId);
                
                // Auto-hide message after 30 seconds for demo purposes
                // In production, you might want multiple reports before taking action
                setTimeout(async () => {
                    try {
                        const messageToDelete = await Message.findById(messageId);
                        if (messageToDelete && messageToDelete.reported) {
                            await Message.findByIdAndDelete(messageId);
                            io.emit('message deleted', messageId);
                            console.log(`Auto-removed reported message ${messageId}`);
                        }
                    } catch (error) {
                        console.error('Error auto-removing message:', error);
                    }
                }, 30000); // Remove after 30 seconds for demo purposes
            }
        } catch (error) {
            console.error('Error reporting message:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (connectedUsers.has(socket.id)) {
            const user = connectedUsers.get(socket.id);
            console.log(`${user.username} disconnected`);
            connectedUsers.delete(socket.id);
        }
        
        io.emit('user count', connectedUsers.size);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Anonymous Chat Server is running on port ${PORT}`);
    console.log(`📱 Server is ready for connections!`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔗 Local URL: http://localhost:${PORT}`);
    }
});
