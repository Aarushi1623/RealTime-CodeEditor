import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { io } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Users, Copy, Send, Code, Globe, MessageCircle, Settings } from 'lucide-react'
import './App.css'

// Language configurations for Monaco Editor
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' }
]

// Socket.io connection
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.replace(/:\d+/, ':5000')
  : 'http://localhost:5000'

function HomePage() {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createRoom = async () => {
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }
    
    setIsCreating(true)
    try {
      const response = await fetch(`${BACKEND_URL}/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      navigate(`/room/${data.roomId}?name=${encodeURIComponent(userName)}`)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID')
      return
    }
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }
    navigate(`/room/${roomId}?name=${encodeURIComponent(userName)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Code className="h-8 w-8 text-blue-600 mr-2" />
            <CardTitle className="text-2xl font-bold">Realtime Code Editor</CardTitle>
          </div>
          <CardDescription>
            Collaborate on code in real-time with multiple users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Button 
              onClick={createRoom} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create New Room'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">or</div>
            
            <div className="space-y-2">
              <Input
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
              <Button onClick={joinRoom} variant="outline" className="w-full">
                Join Existing Room
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CodeEditor() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const urlParams = new URLSearchParams(window.location.search)
  const userName = urlParams.get('name') || 'Anonymous'
  
  // State management
  const [socket, setSocket] = useState(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [users, setUsers] = useState([])
  const [cursors, setCursors] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [roomInfo, setRoomInfo] = useState(null)
  
  // Refs
  const editorRef = useRef(null)
  const socketRef = useRef(null)
  const debounceRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    })
    
    setSocket(newSocket)
    socketRef.current = newSocket

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
      
      // Join room
      newSocket.emit('join-room', {
        roomId,
        user: {
          name: userName,
          id: newSocket.id
        }
      })
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    })

    // Room events
    newSocket.on('room-state', (data) => {
      setCode(data.code)
      setLanguage(data.language)
      setUsers(data.users)
      setCursors(data.cursors)
    })

    newSocket.on('user-joined', (data) => {
      setUsers(data.users)
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'system',
        message: `${data.user.name} joined the room`,
        timestamp: new Date()
      }])
    })

    newSocket.on('user-left', (data) => {
      setUsers(data.users)
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'system',
        message: `User left the room`,
        timestamp: new Date()
      }])
    })

    // Code collaboration events
    newSocket.on('code-change', (data) => {
      setCode(data.code)
    })

    newSocket.on('language-change', (data) => {
      setLanguage(data.language)
    })

    newSocket.on('cursor-change', (data) => {
      setCursors(prev => {
        const filtered = prev.filter(cursor => cursor.userId !== data.userId)
        return [...filtered, { userId: data.userId, user: data.user, ...data.cursor }]
      })
    })

    // Chat events
    newSocket.on('chat-message', (data) => {
      setMessages(prev => [...prev, data])
    })

    return () => {
      newSocket.close()
    }
  }, [roomId, userName])

  // Fetch room info
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/room/${roomId}`)
        if (response.ok) {
          const data = await response.json()
          setRoomInfo(data)
        }
      } catch (error) {
        console.error('Error fetching room info:', error)
      }
    }
    fetchRoomInfo()
  }, [roomId])

  // Handle code changes with debouncing
  const handleCodeChange = useCallback((value) => {
    setCode(value)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('code-change', {
          roomId,
          code: value,
          changes: [] // Monaco provides change events, but we're keeping it simple
        })
      }
    }, 300) // 300ms debounce
  }, [roomId])

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    if (socket && socket.connected) {
      socket.emit('language-change', {
        roomId,
        language: newLanguage
      })
    }
  }

  // Handle cursor position changes
  const handleCursorChange = useCallback((position) => {
    if (socket && socket.connected) {
      socket.emit('cursor-change', {
        roomId,
        cursor: {
          line: position.lineNumber,
          column: position.column
        }
      })
    }
  }, [socket, roomId])

  // Handle chat messages
  const sendMessage = () => {
    if (newMessage.trim() && socket && socket.connected) {
      socket.emit('chat-message', {
        roomId,
        message: newMessage.trim()
      })
      setNewMessage('')
    }
  }

  // Copy room link
  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}?name=${encodeURIComponent('YourName')}`
    navigator.clipboard.writeText(link)
    alert('Room link copied to clipboard!')
  }

  // Monaco editor configuration
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    theme: 'vs-dark'
  }

  if (!roomId) {
    navigate('/')
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Code className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Realtime Code Editor</h1>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={copyRoomLink} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              onClick={() => setShowChat(!showChat)} 
              variant="outline" 
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{users.length} users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={(editor) => {
              editorRef.current = editor
              editor.onDidChangeCursorPosition((e) => {
                handleCursorChange(e.position)
              })
            }}
            options={editorOptions}
            theme="vs-dark"
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Users panel */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Active Users</h3>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-sm text-gray-300">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          {showChat && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Chat</h3>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map(message => (
                    <div key={message.id} className="text-sm">
                      {message.type === 'system' ? (
                        <div className="text-gray-400 italic">{message.message}</div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: message.user?.color }}
                            />
                            <span className="font-medium text-gray-300">
                              {message.user?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-gray-200 ml-4">{message.message}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<CodeEditor />} />
      </Routes>
    </Router>
  )
}

export default App

