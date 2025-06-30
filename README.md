# Realtime Collaborative Code Editor

A sophisticated web-based collaborative code editor that enables multiple users to write, edit, and view code together in real-time. Built with modern web technologies including React.js, Monaco Editor, Node.js, Express, and Socket.io.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can edit code simultaneously with instant synchronization
- **Monaco Editor Integration**: VS Code-like editing experience with syntax highlighting and auto-completion
- **Multi-language Support**: Support for 15+ programming languages including JavaScript, Python, Java, C++, and more
- **Live User Presence**: See who's currently editing with color-coded user indicators
- **Room-based Sessions**: Create or join coding sessions using unique room IDs
- **Persistent Sessions**: Code changes are maintained throughout the session

### Advanced Features
- **Debounced Updates**: Optimized real-time synchronization to reduce network traffic
- **Language Switching**: Change programming language on-the-fly with syntax highlighting updates
- **In-editor Chat**: Built-in chat system for team communication
- **Cursor Tracking**: See other users' cursor positions in real-time
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Share Functionality**: Easy room link sharing for team collaboration

## 🛠 Technology Stack

### Frontend
- **React.js 19.x**: Modern UI framework with hooks and functional components
- **Monaco Editor**: Microsoft's code editor that powers VS Code
- **Socket.io Client**: Real-time bidirectional event-based communication
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality, accessible UI components
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing for single-page application

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Fast, unopinionated web framework
- **Socket.io**: Real-time communication library
- **UUID**: Unique identifier generation for rooms and users
- **CORS**: Cross-origin resource sharing middleware

### Development Tools
- **ESLint**: Code linting and formatting
- **Nodemon**: Automatic server restart during development
- **pnpm**: Fast, disk space efficient package manager

## 📁 Project Structure

```
realtime-code-editor/
├── backend/
│   ├── server.js              # Main server file with Socket.io integration
│   ├── package.json           # Backend dependencies and scripts
│   ├── .env                   # Environment configuration
│   └── node_modules/          # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React application component
│   │   ├── App.css           # Application styles
│   │   ├── main.jsx          # React application entry point
│   │   └── components/       # Reusable UI components
│   ├── public/               # Static assets
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.js        # Vite configuration
│   └── node_modules/         # Frontend dependencies
├── docs/                     # Project documentation
├── README.md                 # This file
└── .gitignore               # Git ignore patterns
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-code-editor
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   pnpm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   # Server will run on http://localhost:5000
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   pnpm run dev
   # Application will be available at http://localhost:5173
   ```

3. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Enter your name and create a new room or join an existing one
   - Share the room link with collaborators

## 🔧 Configuration

### Backend Configuration
The backend server can be configured using environment variables in the `.env` file:

```env
PORT=5000                    # Server port
NODE_ENV=development         # Environment mode
CORS_ORIGIN=*               # CORS allowed origins
```

### Frontend Configuration
The frontend automatically detects the backend URL based on the environment:
- **Development**: `http://localhost:5000`
- **Production**: Uses the same domain with port 5000

## 🌐 API Endpoints

### REST API
- `GET /` - API information and available endpoints
- `GET /health` - Health check and server status
- `POST /room` - Create a new collaboration room
- `GET /room/:id` - Get room information and metadata

### WebSocket Events

#### Client to Server
- `join-room` - Join a collaboration room
- `code-change` - Broadcast code changes
- `language-change` - Change programming language
- `cursor-change` - Update cursor position
- `chat-message` - Send chat message

#### Server to Client
- `room-state` - Initial room state on join
- `user-joined` - New user joined notification
- `user-left` - User left notification  
- `code-change` - Receive code changes from other users
- `language-change` - Language change notification
- `cursor-change` - Other users' cursor positions
- `chat-message` - Receive chat messages

## 🎯 Usage Examples

### Creating a New Room
1. Enter your name on the homepage
2. Click "Create New Room"
3. Share the generated room URL with collaborators

### Joining an Existing Room
1. Enter your name and the room ID
2. Click "Join Existing Room"
3. Start collaborating immediately

### Real-time Collaboration
- Type code and see changes appear instantly for all users
- Switch programming languages using the dropdown
- Use the chat feature for team communication
- See other users' cursors and selections

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Rate Limiting**: Socket events are debounced to prevent spam
- **Room Cleanup**: Inactive rooms are automatically cleaned up
- **No Persistent Storage**: Code is not permanently stored (session-based only)

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   pnpm run build
   ```

2. **Configure environment variables**
   ```bash
   # Set NODE_ENV=production in backend/.env
   NODE_ENV=production
   PORT=5000
   ```

3. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment (Optional)
The application can be containerized using Docker for easy deployment to cloud platforms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - Microsoft's excellent code editor
- **Socket.io** - Real-time communication library
- **React Team** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **shadcn/ui** - For beautiful, accessible UI components

## 📞 Support

For support, questions, or feature requests, please open an issue on the GitHub repository.

---

**Built with ❤️ using modern web technologies**

