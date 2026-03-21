import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { getSocket } from '../utils/socket'
import { Send, Search, MessageSquarePlus, Clock, Check, CheckCheck } from 'lucide-react'

export default function Messages() {
  const { user, token } = useAuth()   // ← use token from AuthContext (correct key)
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch conversation list
  useEffect(() => {
    if (!token) return
    setIsLoadingConvs(true)
    api.get('/api/messages/conversations', token)
      .then(data => {
        const convs = Array.isArray(data) ? data : []
        setConversations(convs)

        // Check if we came from a worker profile to start a conversation
        if (location.state?.startWith && user) {
          const partnerId = location.state.startWith
          const convId = [user.userId, partnerId].sort().join('_')
          const existing = convs.find(c => c.conversationId === convId)

          if (existing) {
            openConversation(existing)
          } else {
            const virtual = {
              conversationId: convId,
              partner: { userId: partnerId, name: location.state.name || 'New Contact', role: location.state.role },
              lastMessage: 'Send the first message...',
              isVirtual: true
            }
            setConversations(prev => [virtual, ...prev])
            setSelectedConv(virtual)
            setShowChat(true)
            setMessages([])
          }
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setIsLoadingConvs(false))
  }, [token, location.state])

  // Connect socket once and listen for new messages
  const selectedConvRef = useRef(selectedConv)
  useEffect(() => {
    selectedConvRef.current = selectedConv
  }, [selectedConv])

  useEffect(() => {
    if (!token || !user) return
    const socket = getSocket(token)

    socket.on('receive_message', (msg) => {
      // Immediately notify backend that message was delivered (or read if currently open)
      const isCurrentConv = selectedConvRef.current?.conversationId === msg.conversationId;
      const newStatus = isCurrentConv && document.visibilityState === 'visible' ? 'READ' : 'DELIVERED';
      
      api.put('/api/messages/status', { messageIds: [msg.messageId], status: newStatus }, token)
        .catch(console.error);

      setMessages(prev => {
        if (!isCurrentConv) return prev;
        if (prev.find(m => m.messageId === msg.messageId)) return prev
        return [...prev, { ...msg, status: newStatus }]
      })
      setConversations(prev => {
        const existing = prev.find(c => c.conversationId === msg.conversationId);
        if (existing) {
          return prev.map(c => c.conversationId === msg.conversationId
            ? { ...c, lastMessage: msg.messageText, lastTimestamp: msg.timestamp, isVirtual: false }
            : c
          );
        } else {
          const isSender = msg.senderId === user.userId;
          const partner = isSender ? msg.receiver : msg.sender;
          return [{
            conversationId: msg.conversationId,
            partner,
            lastMessage: msg.messageText,
            lastTimestamp: msg.timestamp,
            isVirtual: false
          }, ...prev];
        }
      })
    })

    socket.on('message_status_update', ({ messageIds, status }) => {
      setMessages(prev => prev.map(m => 
        messageIds.includes(m.messageId) ? { ...m, status } : m
      ))
    })

    return () => { 
      socket.off('receive_message')
      socket.off('message_status_update')
    }
  }, [token, user])

  // Load messages when a conversation is selected
  const openConversation = async (conv) => {
    setSelectedConv(conv)
    setShowChat(true)
    if (conv.isVirtual) {
      setMessages([])
      const socket = getSocket(token)
      socket.emit('join_room', conv.conversationId)
      return
    }
    setIsLoadingMsgs(true)
    try {
      const msgs = await api.get(`/api/messages/${conv.conversationId}`, token)
      setMessages(Array.isArray(msgs) ? msgs : [])
      
      // Mark unread incoming messages as READ
      const unreadIds = msgs.filter(m => m.receiverId === (user?.userId || user?.id) && m.status !== 'READ').map(m => m.messageId);
      if (unreadIds.length > 0) {
        api.put('/api/messages/status', { messageIds: unreadIds, status: 'READ' }, token)
          .then(() => {
            setMessages(prev => prev.map(m => unreadIds.includes(m.messageId) ? { ...m, status: 'READ' } : m))
          })
          .catch(console.error)
      }
    } catch {
      setMessages([])
    } finally {
      setIsLoadingMsgs(false)
    }
    // Join socket room for real-time updates
    const socket = getSocket(token)
    socket.emit('join_room', conv.conversationId)
  }

  // Send message via HTTP API — backend persists it and broadcasts back via socket to receiver
  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || !token) return
    const text = input.trim()
    setInput('')
    
    // Create optimistic message
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      messageId: tempId,
      conversationId: selectedConv.conversationId,
      senderId: user?.userId || user?.id,
      receiverId: selectedConv.partner.userId,
      messageText: text,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg])
    
    try {
      const message = await api.post('/api/messages', {
        receiverId: selectedConv.partner.userId,
        messageText: text,
        conversationId: selectedConv.conversationId,
      }, token)
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(m => m.messageId === tempId ? message : m))
      
      // Mark conversation as non-virtual after first message and update last message
      setConversations(prev =>
        prev.map(c => c.conversationId === selectedConv.conversationId 
          ? { ...c, isVirtual: false, lastMessage: text, lastTimestamp: message.timestamp } 
          : c
        )
      )
    } catch (error) {
      alert('Failed to send message: ' + error.message)
      setInput(text) // Restore input on failure
    }
  }



  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
  }

  const filtered = conversations.filter(c =>
    c.partner?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">

      {/* ── Sidebar ── */}
      <div className={`${showChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-100 dark:border-slate-800`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Messages</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your conversations</p>
            </div>
            <div className="relative w-2 h-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            </div>
          </div>
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="overflow-y-auto flex-1">
          {isLoadingConvs ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex gap-3 items-center border-b border-slate-50 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 text-slate-400">Browse workers and click <strong>Message</strong> to start chatting</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.conversationId}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                  ${selectedConv?.conversationId === conv.conversationId ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {conv.partner?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-800 dark:text-white truncate">{conv.partner?.name}</span>
                      {conv.lastTimestamp && (
                        <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{formatTime(conv.lastTimestamp)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div className={`${showChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">💬</div>
            <div className="text-center">
              <p className="font-medium text-slate-600 dark:text-slate-300">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Or go to a worker's profile and click <strong>Message</strong></p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition mr-1 text-lg"
                aria-label="Back"
              >
                ←
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedConv.partner?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{selectedConv.partner?.name}</p>
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMsgs ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm py-16">
                  <p>Say hi to <strong className="text-slate-600 dark:text-slate-300">{selectedConv.partner?.name}</strong>!</p>
                  <p className="text-xs mt-1">Be the first to send a message.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.userId || msg.senderId === user?.id
                  return (
                    <div key={msg.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed shadow-sm
                        ${isMine
                          ? 'bg-primary-600 dark:bg-[#005c4b] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm'}`}>
                        <p>{msg.messageText}</p>
                        <div className={`flex items-center gap-1.5 mt-0.5 justify-end text-[10.5px] ${isMine ? 'text-primary-100 dark:text-slate-300' : 'text-slate-400'}`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMine && (
                            <span className="flex items-center drop-shadow-sm">
                              {msg.status === 'PENDING' && <Clock className="w-3 h-3 opacity-80" />}
                              {(!msg.status || msg.status === 'SENT') && <Check className="w-3.5 h-3.5 opacity-80" />}
                              {msg.status === 'DELIVERED' && <CheckCheck className="w-3.5 h-3.5 opacity-80" />}
                              {msg.status === 'READ' && <CheckCheck className="w-3.5 h-3.5 text-blue-400 dark:text-blue-400 opacity-100" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

            </div>

            {/* ── Message Input ── */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={`Message ${selectedConv.partner?.name}...`}
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 transition active:scale-90 flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
