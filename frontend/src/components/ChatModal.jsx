import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/api';
import { io } from 'socket.io-client';
import { MessageSquare, Send, X, Loader2, User } from 'lucide-react';

const ChatModal = ({ booking, isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const bookingId = booking?._id;

  // Determine receiver ID (other party)
  const isCustomer = user?._id === booking?.customerId?._id || user?._id === booking?.customerId;
  const receiverId = isCustomer
    ? booking?.providerId?.userId?._id || booking?.providerId?.userId
    : booking?.customerId?._id || booking?.customerId;

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    // Fetch initial chat history
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await messageService.getBookingMessages(bookingId);
        if (res.success) {
          setMessages(res.messages || []);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Socket.io Real-Time Connection
    const socket = io(window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://localloop-dszf.onrender.com');
    socketRef.current = socket;

    socket.emit('join_room', bookingId);

    socket.on('new_message', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isOpen, bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !booking) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !receiverId) return;

    setSending(true);
    try {
      const res = await messageService.sendMessage({
        bookingId,
        receiverId,
        message: inputText,
      });

      if (res.success && res.message) {
        setInputText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl max-w-lg w-full h-[520px] overflow-hidden flex flex-col border-2 border-[#E8DFC9] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#2B2621] p-4 text-[#FBF7F0] flex items-center justify-between border-b border-[#3E3730]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#C6511F] text-white flex items-center justify-center font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#FBF7F0]">
                {booking.providerId?.businessName || 'Service Chat'}
              </h3>
              <p className="text-[10px] text-[#D6C7B2]">
                Booking #{booking._id?.slice(-6)} • {booking.slot}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#D6C7B2] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FBF7F0]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#C6511F] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8C8275] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#D6C7B2]" />
              <p>No messages yet. Send a message to coordinate service details!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId?._id === user?._id || msg.senderId === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-xs space-y-1 ${
                      isMine
                        ? 'bg-[#C6511F] text-white rounded-br-none'
                        : 'bg-white text-[#2B2621] border border-[#E8DFC9] rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <span
                      className={`text-[9px] block text-right font-mono ${
                        isMine ? 'text-white/75' : 'text-[#8C8275]'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-[#FFFDF9] border-t border-[#E8DFC9] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-[#F2EBDC] rounded-full text-xs font-semibold text-[#2B2621] placeholder:text-[#8C8275] focus:bg-white focus:ring-2 focus:ring-[#C6511F] focus:outline-hidden border border-[#E8DFC9]"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 bg-[#C6511F] hover:bg-[#A84116] text-white rounded-full shadow-md transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
