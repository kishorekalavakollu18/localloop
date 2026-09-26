import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '../services/api';
import { CheckCircle2, XCircle, Sparkles, Bell, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?._id) return;

    const socketUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    const handleNotification = (data) => {
      const id = Date.now();
      const newNotif = { ...data, id };
      setNotifications((prev) => [newNotif, ...prev]);

      // Auto dismiss after 8 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 8000);
    };

    // Listen on customer and provider channels
    socket.on(`customer_notifications_${user._id}`, handleNotification);
    socket.on(`provider_notifications_${user._id}`, handleNotification);

    return () => {
      socket.off(`customer_notifications_${user._id}`, handleNotification);
      socket.off(`provider_notifications_${user._id}`, handleNotification);
      socket.disconnect();
    };
  }, [user]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!user || notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none">
      {notifications.map((notif) => {
        const isConfirmed = notif.status === 'confirmed';
        const isCancelled = notif.status === 'cancelled';
        const isCompleted = notif.status === 'completed';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3.5 animate-form-entrance transition-all duration-300 ${
              isConfirmed
                ? 'bg-emerald-900/95 text-white border-emerald-500/40 ring-2 ring-emerald-500/20'
                : isCancelled
                ? 'bg-rose-950/95 text-white border-rose-500/40 ring-2 ring-rose-500/20'
                : isCompleted
                ? 'bg-indigo-950/95 text-white border-indigo-500/40 ring-2 ring-indigo-500/20'
                : 'bg-[#2B2621]/95 text-white border-[#C6511F]/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isConfirmed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : isCancelled ? (
                <XCircle className="w-6 h-6 text-rose-400" />
              ) : isCompleted ? (
                <Sparkles className="w-6 h-6 text-amber-400" />
              ) : (
                <Bell className="w-6 h-6 text-terracotta" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-white/90">
                  {isConfirmed
                    ? '🎉 Service Confirmed!'
                    : isCancelled
                    ? '❌ Request Rejected / Cancelled'
                    : isCompleted
                    ? '✨ Appointment Completed'
                    : '🔔 Service Update'}
                </h4>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-white/60 hover:text-white p-0.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-white/90 leading-relaxed">
                {notif.message}
              </p>

              {notif.booking && (
                <div className="pt-1.5 flex items-center justify-between text-[11px] text-white/70">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-white/50" />
                    {new Date(notif.booking.serviceDate).toLocaleDateString()} ({notif.booking.slot})
                  </span>

                  <button
                    onClick={() => {
                      removeNotification(notif.id);
                      if (user?.role === 'provider') {
                        navigate('/provider/dashboard');
                      } else {
                        navigate('/customer/dashboard');
                      }
                    }}
                    className="font-bold underline text-amber-300 hover:text-white cursor-pointer ml-2"
                  >
                    View Details →
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
