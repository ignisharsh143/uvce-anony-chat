# 🎓 College Confessions - Anonymous Chat Website

A fun and safe anonymous confession and chatting platform designed specifically for college students to share thoughts, confessions, and connect with their peers in a secure environment.

## ✨ Features

### Core User Experience
- **🔒 Terms & Conditions Agreement**: Simple modal popup with community guidelines that users must accept before accessing the chat
- **🎭 Instantaneous Anonymous Access**: No signup required - users get a random, fun anonymous identity like "Curious Owl #123"
- **⚡ Real-Time Chat Feed**: Live messaging with Socket.IO - messages appear instantly without page refresh
- **💬 Simplified Message Input**: Clean text box with send button and Enter key support, 500 character limit

### Safety & Moderation
- **🛡️ Basic Moderation Tools**: Built-in profanity filter that automatically censors inappropriate words
- **🚩 Reporting System**: One-click reporting with flag button on each message
- **⏰ Ephemeral Data**: Messages automatically delete after 24 hours for privacy
- **👍 Simple Reactions**: Like (👍) and heart (❤️) reactions instead of replies to keep conversations positive

### Design & Aesthetics
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **🎨 College-Themed Interface**: Modern gradient design with purple/blue college colors
- **🌟 Beautiful UI**: Smooth animations, modern styling, and intuitive user experience

## 🚀 Getting Started

### Prerequisites
- Node.js (v12 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download the project files**
2. **Navigate to the project directory**
   ```bash
   cd "Anony Chat"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Go to `http://localhost:3000`
   - Accept the terms and conditions
   - Start chatting anonymously!

## 🏗️ Project Structure

```
Anony Chat/
├── package.json          # Project dependencies and scripts
├── server.js             # Express server with Socket.IO
├── README.md             # This file
└── public/               # Static frontend files
    ├── index.html        # Main HTML structure
    ├── style.css         # Responsive CSS styling
    └── script.js         # Client-side JavaScript
```

## 🔧 Technical Details

### Backend (server.js)
- **Express.js**: Web server framework
- **Socket.IO**: Real-time bidirectional communication
- **In-memory storage**: Messages, reactions, and user data (use database in production)
- **Auto-cleanup**: Removes messages older than 24 hours
- **Moderation**: Handles message reporting and automatic removal

### Frontend
- **Vanilla JavaScript**: No frameworks - lightweight and fast
- **Socket.IO Client**: Real-time messaging
- **Responsive CSS**: Mobile-first design with CSS Grid and Flexbox
- **Local Storage**: Remembers terms acceptance

### Key Features Implementation

#### Anonymous Identity Generation
- Random combination of adjectives + animals + numbers
- Changes on each visit for true anonymity
- Examples: "Curious Owl #123", "Brave Fox #456"

#### Message Flow
1. User types message → Client validates → Server receives
2. Server applies profanity filter → Stores message → Broadcasts to all clients
3. Clients receive message → Display with reactions and report button

#### Reporting System
1. User clicks flag button → Confirmation dialog
2. Server marks message as reported → Auto-removes after 30 seconds
3. Reporter gets confirmation notification

## 🛡️ Safety Features

- **Profanity Filter**: Automatically censors inappropriate language
- **Message Reporting**: Easy one-click reporting system
- **Ephemeral Messages**: Auto-deletion after 24 hours
- **No Personal Data**: No registration, no data collection
- **Anonymous Identities**: Non-persistent, changes each visit

## 🎨 Customization

### College Branding
To customize for your college:

1. **Colors**: Edit the CSS variables in `style.css`
   ```css
   :root {
     --primary-color: #your-college-color;
     --secondary-color: #your-secondary-color;
   }
   ```

2. **Logo/Mascot**: Add your college logo to the header in `index.html`

3. **Welcome Message**: Customize the welcome text in `index.html`

### Adding Features
- **Database**: Replace in-memory storage with MongoDB/PostgreSQL
- **Admin Panel**: Add authentication and admin controls
- **File Sharing**: Allow image/file uploads
- **Rooms**: Create separate chat rooms by department/year

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment
1. **Environment Variables**: Set `PORT` environment variable
2. **Database**: Replace in-memory storage with persistent database
3. **Security**: Add rate limiting, CORS configuration
4. **HTTPS**: Use SSL certificate for secure connections

### Recommended Platforms
- **Heroku**: Easy deployment with Git
- **Vercel**: Great for static sites with serverless functions
- **DigitalOcean**: Full control with droplets
- **AWS**: Scalable cloud deployment

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a college project, but feel free to:
1. Report bugs or suggest features
2. Fork and create your own version
3. Submit pull requests for improvements

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Admin dashboard for moderation
- [ ] Multiple chat rooms/channels
- [ ] Image sharing capabilities
- [ ] Push notifications
- [ ] Dark/light theme toggle
- [ ] Message search functionality
- [ ] User blocking (while maintaining anonymity)

## 🆘 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Dependencies not installing**
```bash
# Clear npm cache
npm cache clean --force
npm install
```

**Messages not appearing**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

## 📞 Support

For technical issues or questions about the code, check the browser console for error messages and ensure all dependencies are properly installed.

---

**Made with ❤️ for college students who want to connect anonymously and safely!**

🎓 Happy chatting! 🎉
