import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, API_URL } from '../services/api';
import { io } from 'socket.io-client';
import L from 'leaflet';
import ChatModal from '../components/ChatModal';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Compass,
  Play,
  Pause,
  RotateCcw,
  CheckCheck,
  Loader2,
  ShieldCheck,
  Star,
  Activity,
  Layers,
} from 'lucide-react';

const LiveTrackingPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Tracking state
  const [providerCoords, setProviderCoords] = useState(null); // [lat, lng]
  const [customerCoords, setCustomerCoords] = useState(null); // [lat, lng]
  const [routePolyline, setRoutePolyline] = useState([]); // Array of [lat, lng]
  const [distanceKm, setDistanceKm] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isGpsStreaming, setIsGpsStreaming] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [completingService, setCompletingService] = useState(false);

  // Leaflet map refs to reuse instances
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const socketRef = useRef(null);
  const lastEmitTimeRef = useRef(0);

  // Identify roles
  const isProvider =
    user?._id &&
    booking?.providerId &&
    (booking.providerId.userId?._id === user._id ||
      booking.providerId.userId === user._id ||
      user.role === 'provider');

  const isCustomer =
    user?._id &&
    booking?.customerId &&
    (booking.customerId._id === user._id || booking.customerId === user._id);

  // 1. Fetch initial booking details
  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.getById(bookingId);
      if (res.success && res.booking) {
        const b = res.booking;
        setBooking(b);

        // Extract Customer Coordinates [lng, lat] -> [lat, lng]
        const cust = b.customerLocation?.coordinates;
        if (Array.isArray(cust) && cust.length === 2) {
          setCustomerCoords([cust[1], cust[0]]);
        } else {
          setCustomerCoords([12.9716, 77.5946]); // fallback
        }

        // Extract Provider Coordinates [lng, lat] -> [lat, lng]
        const prov =
          b.liveTracking?.currentProviderLocation?.coordinates ||
          b.providerId?.currentLocation?.coordinates ||
          b.providerId?.location?.coordinates;

        if (Array.isArray(prov) && prov.length === 2) {
          setProviderCoords([prov[1], prov[0]]);
        }

        if (b.liveTracking) {
          if (b.liveTracking.distanceRemainingKm !== undefined) {
            setDistanceKm(b.liveTracking.distanceRemainingKm);
          }
          if (b.liveTracking.etaMinutes !== undefined) {
            setEtaMinutes(b.liveTracking.etaMinutes);
          }
          if (Array.isArray(b.liveTracking.routePolyline) && b.liveTracking.routePolyline.length > 0) {
            setRoutePolyline(b.liveTracking.routePolyline);
          }
          if (b.liveTracking.heading) setHeading(b.liveTracking.heading);
          if (b.liveTracking.speed) setSpeed(b.liveTracking.speed);
          if (b.liveTracking.lastUpdated) setLastUpdated(new Date(b.liveTracking.lastUpdated));
          if (b.liveTracking.isTrackingActive) setIsGpsStreaming(true);
        }

        // Also fetch initial road route if not present
        if (!b.liveTracking?.routePolyline || b.liveTracking.routePolyline.length === 0) {
          try {
            const routeRes = await bookingService.getRoute(bookingId);
            if (routeRes.success && routeRes.route) {
              setRoutePolyline(routeRes.route.polyline || []);
              if (routeRes.route.distanceKm) setDistanceKm(routeRes.route.distanceKm);
              if (routeRes.route.etaMinutes) setEtaMinutes(routeRes.route.etaMinutes);
            }
          } catch (rErr) {
            console.warn('Initial route fetch error:', rErr.message);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load booking tracking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // 2. Initialize Leaflet Map (Reused, never re-created)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = customerCoords || providerCoords || [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Customer Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !customerCoords) return;

    const customerIcon = L.divIcon({
      className: 'customer-delivery-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: #2B2621;
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
            margin-bottom: 2px;
            border: 1px solid #4A4036;
          ">
            🏠 Customer Destination
          </div>
          <div style="
            width: 32px;
            height: 32px;
            background: #C6511F;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(198,81,31,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        </div>
      `,
      iconSize: [120, 50],
      iconAnchor: [60, 48],
    });

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng(customerCoords);
    } else {
      customerMarkerRef.current = L.marker(customerCoords, {
        icon: customerIcon,
        zIndexOffset: 500,
      })
        .addTo(map)
        .bindPopup(`<b>Service Destination</b><br/>${booking?.customerAddress || 'Customer Location'}`);
    }
  }, [customerCoords, booking?.customerAddress]);

  // 4. Update Provider Moving Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !providerCoords) return;

    const providerIcon = L.divIcon({
      className: 'provider-moving-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: #C6511F;
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(198,81,31,0.4);
            white-space: nowrap;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="display: inline-block; width: 6px; height: 6px; background: #4ADE80; border-radius: 50%;"></span>
            ${booking?.providerId?.businessName || 'Provider'}
          </div>
          <div style="position: relative;">
            <div style="
              position: absolute;
              inset: -8px;
              border-radius: 50%;
              background: rgba(198,81,31,0.3);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 38px;
              height: 38px;
              background: #2B2621;
              border: 3px solid #E8DFC9;
              border-radius: 50%;
              box-shadow: 0 4px 14px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 18px;
              transform: rotate(${heading || 0}deg);
              transition: transform 0.3s ease;
            ">
              🚗
            </div>
          </div>
        </div>
      `,
      iconSize: [140, 60],
      iconAnchor: [70, 50],
    });

    if (providerMarkerRef.current) {
      providerMarkerRef.current.setLatLng(providerCoords);
      providerMarkerRef.current.setIcon(providerIcon);
    } else {
      providerMarkerRef.current = L.marker(providerCoords, {
        icon: providerIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`<b>${booking?.providerId?.businessName || 'Provider'}</b><br/>Live GPS Active`);
    }
  }, [providerCoords, heading, booking?.providerId?.businessName]);

  // 5. Update Road Polyline & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (Array.isArray(routePolyline) && routePolyline.length > 1) {
      const line = L.polyline(routePolyline, {
        color: '#C6511F',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: null,
      }).addTo(map);

      polylineRef.current = line;

      // Adjust camera to view full route with padding
      try {
        const bounds = line.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch (e) {}
    } else if (customerCoords && providerCoords) {
      // Fallback straight line if polyline not yet calculated
      const line = L.polyline([providerCoords, customerCoords], {
        color: '#C6511F',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.6,
      }).addTo(map);
      polylineRef.current = line;
      map.fitBounds([providerCoords, customerCoords], { padding: [60, 60] });
    }
  }, [routePolyline, customerCoords, providerCoords]);

  // 6. Socket.io Real-Time Room & Event Listener (Customer & Provider)
  useEffect(() => {
    if (!bookingId) return;

    const socketUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Join tracking room for this booking
    socket.emit('join_tracking_room', bookingId);

    // Listen for moving marker updates from provider device
    socket.on('provider_location_changed', (data) => {
      if (data && data.coordinates && Array.isArray(data.coordinates)) {
        const [lng, lat] = data.coordinates;
        setProviderCoords([lat, lng]);

        if (data.heading !== undefined) setHeading(data.heading);
        if (data.speed !== undefined) setSpeed(data.speed);
        if (data.distanceRemainingKm !== undefined) setDistanceKm(data.distanceRemainingKm);
        if (data.etaMinutes !== undefined) setEtaMinutes(data.etaMinutes);
        if (Array.isArray(data.routePolyline) && data.routePolyline.length > 0) {
          setRoutePolyline(data.routePolyline);
        }
        setLastUpdated(new Date());
      }
    });

    // Listen for tracking stopped or service status change
    socket.on('tracking_stopped', (data) => {
      setIsGpsStreaming(false);
      if (data.status) {
        setBooking((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });

    socket.on(`booking_status_${bookingId}`, (data) => {
      if (data && data.booking) {
        setBooking(data.booking);
        if (data.status === 'completed' || data.status === 'cancelled') {
          setIsGpsStreaming(false);
        }
      }
    });

    return () => {
      socket.emit('leave_tracking_room', bookingId);
      socket.off('provider_location_changed');
      socket.off('tracking_stopped');
      socket.off(`booking_status_${bookingId}`);
      socket.disconnect();
    };
  }, [bookingId]);

  // 7. Device GPS Tracking Engine for Provider (`navigator.geolocation.watchPosition`)
  const startProviderGpsWatch = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');
    setIsGpsStreaming(true);

    // Start tracking on backend
    bookingService.startTracking(bookingId, null).catch((e) => console.warn(e));

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading: h, speed: s, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setProviderCoords([latitude, longitude]);
        if (h !== null && !isNaN(h)) setHeading(Math.round(h));
        if (s !== null && !isNaN(s)) setSpeed(Math.round(s * 3.6)); // m/s to km/h

        // Throttle updates: send at most once every 3 seconds to prevent flooding
        const now = Date.now();
        if (now - lastEmitTimeRef.current >= 3000) {
          lastEmitTimeRef.current = now;

          const token = localStorage.getItem('token');
          // 1. Real-time Socket.io emission
          if (socketRef.current) {
            socketRef.current.emit('provider_location_update', {
              bookingId,
              coordinates: [longitude, latitude],
              heading: h || 0,
              speed: s || 0,
              token,
            });
          }

          // 2. REST backend sync fallback
          try {
            await bookingService.updateLiveLocation(bookingId, {
              coordinates: [longitude, latitude],
              heading: h || 0,
              speed: s || 0,
            });
          } catch (e) {
            console.warn('Live location REST sync warning:', e.message);
          }
        }
      },
      (err) => {
        console.warn('watchPosition error:', err);
        setGpsError(`Device GPS Warning: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );
  };

  const stopProviderGpsWatch = (markCompleted = false) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsStreaming(false);

    if (socketRef.current) {
      socketRef.current.emit('stop_tracking', { bookingId });
    }

    bookingService.stopTracking(bookingId, markCompleted).catch((e) => console.warn(e));
  };

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Provider Mark Service Completed
  const handleCompleteService = async () => {
    if (!window.confirm('Are you sure the service has been completed?')) return;
    setCompletingService(true);
    try {
      stopProviderGpsWatch(true);
      await bookingService.updateStatus(bookingId, 'completed');
      setBooking((prev) => (prev ? { ...prev, status: 'completed' } : null));
    } catch (err) {
      alert(err.message || 'Failed to complete service.');
    } finally {
      setCompletingService(false);
    }
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (polylineRef.current) {
      try {
        map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
      } catch (e) {
        if (providerCoords) map.setView(providerCoords, 15);
      }
    } else if (providerCoords) {
      map.setView(providerCoords, 15);
    } else if (customerCoords) {
      map.setView(customerCoords, 15);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#C6511F] animate-spin" />
        <p className="text-sm font-bold text-slate-700">Connecting to Live GPS Engine...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600" />
        <h2 className="text-lg font-bold text-slate-800">Booking Tracking Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm">{error || 'Could not load service booking details.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-[#C6511F] text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const provider = booking.providerId || {};
  const customer = booking.customerId || {};
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-gradient-to-r from-[#2B2621] via-[#38302A] to-[#2B2621] text-white px-4 sm:px-6 py-3.5 border-b border-[#4A4036] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isProvider ? '/provider/dashboard' : '/customer/dashboard')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight">
                {provider.businessName || 'Service Provider'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#C6511F] text-white rounded-md">
                {provider.category || 'Service'}
              </span>
            </div>
            <p className="text-[11px] text-[#E8DFC9] flex items-center gap-1.5">
              <span>Appointment: {booking.slot}</span>
              <span>•</span>
              <span className="capitalize">{booking.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live ETA Pill */}
          <div className="bg-[#C6511F] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white" />
            <div className="text-right">
              <span className="text-[10px] font-semibold text-white/80 block leading-tight">ETA</span>
              <span className="text-xs font-black text-white leading-tight">
                {isCompleted ? 'Arrived' : etaMinutes ? `${etaMinutes} mins` : 'Calculating...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left / Top Map Container */}
        <div className="flex-1 relative min-h-[420px] sm:min-h-[500px] lg:min-h-full">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Floating Map Controls & GPS Status Badge */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-[#E8DFC9] flex items-center gap-2 text-xs font-bold text-slate-800">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isGpsStreaming
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {isCompleted
                  ? 'Job Completed'
                  : isGpsStreaming
                  ? 'GPS Streaming Live'
                  : 'GPS Standby'}
              </span>
              {gpsAccuracy && isGpsStreaming && (
                <span className="text-[10px] text-slate-500 font-medium ml-1">
                  (±{gpsAccuracy}m)
                </span>
              )}
            </div>

            {distanceKm !== null && !isCompleted && (
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-[#E8DFC9] text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#C6511F]" />
                <span>{distanceKm} km to destination</span>
              </div>
            )}
          </div>

          {/* Floating Recenter Button */}
          <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleRecenter}
              className="bg-white hover:bg-slate-50 p-2.5 rounded-2xl shadow-xl border border-[#E8DFC9] text-slate-700 hover:text-[#C6511F] transition-all flex items-center justify-center"
              title="Recenter Route"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right / Bottom Swiggy-Style Status Drawer */}
        <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-[#E8DFC9] p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-5 z-20 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-61px)]">
          {/* Status Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Service Status
              </span>
              <StatusBadge status={booking.status} />
            </div>

            {/* Step Progress Visualizer */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-700">1. Booked</span>
                <span className={booking.status !== 'pending' ? 'text-emerald-700' : 'text-slate-400'}>
                  2. Confirmed
                </span>
                <span
                  className={
                    booking.status === 'in_progress' || isCompleted
                      ? 'text-[#C6511F]'
                      : 'text-slate-400'
                  }
                >
                  3. On The Way
                </span>
                <span className={isCompleted ? 'text-emerald-700' : 'text-slate-400'}>
                  4. Completed
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-emerald-600'
                      : booking.status === 'in_progress'
                      ? 'w-3/4 bg-[#C6511F]'
                      : booking.status === 'confirmed'
                      ? 'w-1/2 bg-[#5C7A5C]'
                      : 'w-1/4 bg-amber-500'
                  }`}
                />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {isCompleted
                  ? '✨ Service has been successfully delivered and completed!'
                  : booking.status === 'in_progress'
                  ? '🚗 Provider is en route to your address with live GPS tracking.'
                  : booking.status === 'confirmed'
                  ? '👍 Booking is confirmed. Provider will start live navigation soon.'
                  : '⏳ Waiting for provider confirmation.'}
              </p>
            </div>
          </div>

          {/* Provider Profile Card */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8DFC9] overflow-hidden border border-[#D6C7B2] shrink-0">
                <img
                  src={
                    provider.images?.[0] ||
                    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {provider.businessName || 'Service Provider'}
                </h4>
                <p className="text-xs text-slate-500 capitalize">{provider.category} Specialist</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {provider.rating?.avg ? provider.rating.avg.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${provider.phone || provider.userId?.phone || ''}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold border border-[#E8DFC9] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C6511F]" />
                <span>Call Provider</span>
              </a>

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F7EBE5] text-[#C6511F] hover:bg-[#F0D5C9] rounded-xl text-xs font-bold border border-[#F0D5C9] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat</span>
              </button>
            </div>
          </div>

          {/* Delivery Destination Address */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
              Destination Address
            </span>
            <div className="flex items-start gap-2 text-slate-800 font-medium">
              <MapPin className="w-4 h-4 text-[#C6511F] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  {booking.customerAddress || customer.address || 'Location provided'}
                </p>
                {(booking.customerPincode || customer.pincode) && (
                  <p className="text-[11px] text-slate-500">
                    PIN Code: {booking.customerPincode || customer.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Provider Specific GPS Controls */}
          {isProvider && !isCompleted && !isCancelled && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#C6511F]" />
                  Provider GPS Console
                </span>
                <span className="text-[10px] text-amber-800 font-medium">Device Sensor</span>
              </div>

              {gpsError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {gpsError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {!isGpsStreaming ? (
                  <button
                    type="button"
                    onClick={startProviderGpsWatch}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#C6511F] hover:bg-[#B04316] text-white rounded-xl text-xs font-bold shadow-md shadow-[#C6511F]/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start GPS Navigation</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => stopProviderGpsWatch(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Pause className="w-3.5 h-3.5 fill-white" />
                    <span>Pause GPS</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCompleteService}
                  disabled={completingService}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {completingService ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Complete Job</span>
                </button>
              </div>
            </div>
          )}

          {/* Pricing Info */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500 block">Service Fee</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ₹{provider.pricing?.amount || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">
                  ({provider.pricing?.type || 'per job'})
                </span>
              </span>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
              Cash/UPI on completion
            </span>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        booking={booking}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default LiveTrackingPage;
