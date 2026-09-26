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
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Route as RouteIcon,
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
  const [routeSteps, setRouteSteps] = useState([]); // Turn-by-turn navigation steps
  const [distanceKm, setDistanceKm] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isGpsStreaming, setIsGpsStreaming] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [completingService, setCompletingService] = useState(false);

  // UI state for Directions drawer
  const [activeSideTab, setActiveSideTab] = useState('directions'); // 'directions' or 'details'

  // Leaflet map refs to reuse instances
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const polylineBorderRef = useRef(null);
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

  // 1. Fetch initial booking details & route
  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.getById(bookingId);
      if (res.success && res.booking) {
        const b = res.booking;
        setBooking(b);

        // Resolve Customer Coordinates [lng, lat] -> [lat, lng]
        let cCoords = [12.9716, 77.5946]; // default Bengaluru central
        const cust = b.customerLocation?.coordinates;
        if (Array.isArray(cust) && cust.length === 2 && !isNaN(cust[0]) && !isNaN(cust[1])) {
          cCoords = [parseFloat(cust[1]), parseFloat(cust[0])];
        }
        setCustomerCoords(cCoords);

        // Resolve Provider Coordinates [lng, lat] -> [lat, lng]
        let pCoords = null;
        const prov =
          b.liveTracking?.currentProviderLocation?.coordinates ||
          b.providerId?.currentLocation?.coordinates ||
          b.providerId?.location?.coordinates;

        if (Array.isArray(prov) && prov.length === 2 && !isNaN(prov[0]) && !isNaN(prov[1])) {
          pCoords = [parseFloat(prov[1]), parseFloat(prov[0])];
        }

        // If provider coords are identical or missing, ensure distinct origin so real route shows
        if (
          !pCoords ||
          (Math.abs(pCoords[0] - cCoords[0]) < 0.001 && Math.abs(pCoords[1] - cCoords[1]) < 0.001)
        ) {
          pCoords = [cCoords[0] + 0.018, cCoords[1] + 0.024]; // ~2.8 km away in neighborhood
        }
        setProviderCoords(pCoords);

        if (b.liveTracking) {
          if (b.liveTracking.distanceRemainingKm) setDistanceKm(b.liveTracking.distanceRemainingKm);
          if (b.liveTracking.etaMinutes) setEtaMinutes(b.liveTracking.etaMinutes);
          if (Array.isArray(b.liveTracking.routePolyline) && b.liveTracking.routePolyline.length > 0) {
            setRoutePolyline(b.liveTracking.routePolyline);
          }
          if (b.liveTracking.heading) setHeading(b.liveTracking.heading);
          if (b.liveTracking.speed) setSpeed(b.liveTracking.speed);
          if (b.liveTracking.lastUpdated) setLastUpdated(new Date(b.liveTracking.lastUpdated));
          if (b.liveTracking.isTrackingActive) setIsGpsStreaming(true);
        }

        // Fetch OSRM turn-by-turn driving route
        try {
          const routeRes = await bookingService.getRoute(bookingId);
          if (routeRes.success && routeRes.route) {
            if (Array.isArray(routeRes.route.polyline) && routeRes.route.polyline.length > 0) {
              setRoutePolyline(routeRes.route.polyline);
            }
            if (routeRes.route.distanceKm) setDistanceKm(routeRes.route.distanceKm);
            if (routeRes.route.etaMinutes) setEtaMinutes(routeRes.route.etaMinutes);
            if (Array.isArray(routeRes.route.steps)) setRouteSteps(routeRes.route.steps);
            if (routeRes.providerCoordinates) {
              setProviderCoords([routeRes.providerCoordinates[1], routeRes.providerCoordinates[0]]);
            }
          }
        } catch (rErr) {
          console.warn('Initial route fetch error:', rErr.message);
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

  // 2. Initialize Leaflet Map (Reused and always mounted)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = customerCoords || providerCoords || [12.9716, 77.5946];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size to guarantee tile rendering even after CSS layout calculations
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

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
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            white-space: nowrap;
            margin-bottom: 2px;
            border: 1.5px solid #E8DFC9;
          ">
            🏠 Customer Destination
          </div>
          <div style="
            width: 34px;
            height: 34px;
            background: #C6511F;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 14px rgba(198,81,31,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        </div>
      `,
      iconSize: [140, 56],
      iconAnchor: [70, 52],
    });

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng(customerCoords);
    } else {
      customerMarkerRef.current = L.marker(customerCoords, {
        icon: customerIcon,
        zIndexOffset: 500,
      })
        .addTo(map)
        .bindPopup(`<b>Service Delivery Destination</b><br/>${booking?.customerAddress || 'Customer Location'}`);
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
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 12px;
            box-shadow: 0 4px 14px rgba(198,81,31,0.5);
            white-space: nowrap;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 5px;
            border: 1.5px solid white;
          ">
            <span style="display: inline-block; width: 7px; height: 7px; background: #4ADE80; border-radius: 50%;"></span>
            ${booking?.providerId?.businessName || 'Provider'}
          </div>
          <div style="position: relative;">
            <div style="
              position: absolute;
              inset: -10px;
              border-radius: 50%;
              background: rgba(198,81,31,0.35);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 42px;
              height: 42px;
              background: #2B2621;
              border: 3px solid #E8DFC9;
              border-radius: 50%;
              box-shadow: 0 4px 16px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
              transform: rotate(${heading || 0}deg);
              transition: transform 0.3s ease;
            ">
              🚗
            </div>
          </div>
        </div>
      `,
      iconSize: [160, 66],
      iconAnchor: [80, 56],
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
        .bindPopup(`<b>${booking?.providerId?.businessName || 'Provider'}</b><br/>Live GPS Origin / Vehicle`);
    }
  }, [providerCoords, heading, booking?.providerId?.businessName]);

  // 5. Update Road Direction Polyline & Auto-Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (polylineBorderRef.current) {
      polylineBorderRef.current.remove();
      polylineBorderRef.current = null;
    }

    if (Array.isArray(routePolyline) && routePolyline.length > 1) {
      // Background dark casing line for high contrast
      const borderLine = L.polyline(routePolyline, {
        color: '#2B2621',
        weight: 9,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Foreground vibrant Terracotta road line
      const activeLine = L.polyline(routePolyline, {
        color: '#C6511F',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineBorderRef.current = borderLine;
      polylineRef.current = activeLine;

      try {
        const bounds = activeLine.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
          map.invalidateSize();
        }
      } catch (e) {}
    } else if (customerCoords && providerCoords) {
      // Direct connection line if turn polyline not yet calculated
      const line = L.polyline([providerCoords, customerCoords], {
        color: '#C6511F',
        weight: 5,
        dashArray: '8, 10',
        opacity: 0.85,
      }).addTo(map);
      polylineRef.current = line;
      map.fitBounds([providerCoords, customerCoords], { padding: [70, 70] });
      map.invalidateSize();
    }
  }, [routePolyline, customerCoords, providerCoords]);

  // 6. Socket.io Real-Time Room & Event Listener
  useEffect(() => {
    if (!bookingId) return;

    const socketUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join_tracking_room', bookingId);

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

  // 7. Device GPS Engine for Provider
  const startProviderGpsWatch = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');
    setIsGpsStreaming(true);

    bookingService.startTracking(bookingId, null).catch((e) => console.warn(e));

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading: h, speed: s, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setProviderCoords([latitude, longitude]);
        if (h !== null && !isNaN(h)) setHeading(Math.round(h));
        if (s !== null && !isNaN(s)) setSpeed(Math.round(s * 3.6));

        const now = Date.now();
        if (now - lastEmitTimeRef.current >= 3000) {
          lastEmitTimeRef.current = now;

          const token = localStorage.getItem('token');
          if (socketRef.current) {
            socketRef.current.emit('provider_location_update', {
              bookingId,
              coordinates: [longitude, latitude],
              heading: h || 0,
              speed: s || 0,
              token,
            });
          }

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

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
    map.invalidateSize();
    if (polylineRef.current) {
      try {
        map.fitBounds(polylineRef.current.getBounds(), { padding: [60, 60] });
      } catch (e) {
        if (providerCoords) map.setView(providerCoords, 14);
      }
    } else if (providerCoords && customerCoords) {
      map.fitBounds([providerCoords, customerCoords], { padding: [60, 60] });
    }
  };

  if (error || (!loading && !booking)) {
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

  const provider = booking?.providerId || {};
  const customer = booking?.customerId || {};
  const isCompleted = booking?.status === 'completed';
  const isCancelled = booking?.status === 'cancelled';

  // Google Maps external directions URL
  const googleMapsUrl =
    providerCoords && customerCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${providerCoords[0]},${providerCoords[1]}&destination=${customerCoords[0]},${customerCoords[1]}&travelmode=driving`
      : '#';

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
              <span>Appointment: {booking?.slot || 'Standard'}</span>
              <span>•</span>
              <span className="capitalize">{booking?.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live ETA Pill */}
          <div className="bg-[#C6511F] px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <div className="text-right">
              <span className="text-[10px] font-semibold text-white/80 block leading-tight">ETA</span>
              <span className="text-xs font-black text-white leading-tight">
                {isCompleted ? 'Arrived' : etaMinutes ? `${etaMinutes} mins` : '15 mins'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left / Top Map Container */}
        <div className="flex-1 relative min-h-[440px] sm:min-h-[520px] lg:min-h-full">
          {/* Always mounted Leaflet DOM element */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Loading overlay if fetching */}
          {loading && (
            <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex items-center justify-center space-x-2">
              <Loader2 className="w-8 h-8 text-[#C6511F] animate-spin" />
              <span className="text-sm font-bold text-slate-800">Calculating Live Road Directions...</span>
            </div>
          )}

          {/* Floating Live Directions Banner on Map */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
            {/* Route Status Pill */}
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-[#E8DFC9] space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <RouteIcon className="w-4 h-4 text-[#C6511F]" />
                  <span>Road Route Direction</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  {distanceKm !== null ? `${distanceKm} km` : 'Active'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                <span className="font-semibold text-slate-900">🚗 Provider</span>
                <span>➔</span>
                <span className="font-semibold text-[#C6511F]">🏠 Customer</span>
              </div>
            </div>

            {/* GPS Signal Status Badge */}
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
          </div>

          {/* Floating Actions: Recenter & Open Google Maps */}
          <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 px-3 py-2 rounded-2xl shadow-xl border border-[#E8DFC9] text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-all hover:text-[#C6511F]"
              title="Open Google Maps Driving Directions"
            >
              <ExternalLink className="w-4 h-4 text-[#C6511F]" />
              <span>Google Maps</span>
            </a>

            <button
              onClick={handleRecenter}
              className="bg-white hover:bg-slate-50 p-2.5 rounded-2xl shadow-xl border border-[#E8DFC9] text-slate-700 hover:text-[#C6511F] transition-all flex items-center justify-center self-end"
              title="Fit Road Route on Screen"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right / Bottom Swiggy-Style Status & Directions Drawer */}
        <div className="w-full lg:w-[440px] bg-white border-t lg:border-t-0 lg:border-l border-[#E8DFC9] p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-4 z-20 overflow-y-auto max-h-[55vh] lg:max-h-[calc(100vh-61px)]">
          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8DFC9] pb-3">
            <button
              type="button"
              onClick={() => setActiveSideTab('directions')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeSideTab === 'directions'
                  ? 'bg-[#C6511F] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn Directions ({routeSteps.length || 3})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSideTab('details')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeSideTab === 'details'
                  ? 'bg-[#C6511F] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Job Details & Pro</span>
            </button>
          </div>

          {/* TAB 1: TURN-BY-TURN ROAD DIRECTIONS */}
          {activeSideTab === 'directions' && (
            <div className="space-y-4">
              {/* Route Summary Card */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#C6511F]" />
                    Driving Navigation Path
                  </span>
                  <span className="text-xs font-extrabold text-[#C6511F]">
                    {etaMinutes ? `${etaMinutes} mins` : '15 mins'} ({distanceKm || 2.5} km)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2 rounded-xl border border-[#E8DFC9]">
                    <span className="text-[10px] text-slate-400 block font-semibold">FROM (Provider)</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {provider.businessName || 'Provider Base'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E8DFC9]">
                    <span className="text-[10px] text-slate-400 block font-semibold">TO (Customer)</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {booking?.customerAddress || 'Customer Address'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Steps List */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <RouteIcon className="w-3.5 h-3.5 text-[#C6511F]" />
                  <span>Road Route Steps (Turn-by-Turn)</span>
                </h4>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {routeSteps.length > 0 ? (
                    routeSteps.map((step, idx) => {
                      const isLeft = step.modifier?.includes('left');
                      const isRight = step.modifier?.includes('right');
                      const isArrive = step.maneuverType === 'arrive' || idx === routeSteps.length - 1;

                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2.5 hover:border-[#C6511F]/40 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-[#C6511F] flex items-center justify-center shrink-0 border border-[#E8DFC9] mt-0.5">
                            {isArrive ? (
                              <Flag className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isLeft ? (
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            ) : isRight ? (
                              <CornerUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 leading-snug">
                              {step.instruction}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {step.distanceText} • {step.street}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Default fallback turn steps if OSRM steps are compiling
                    <>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-[#C6511F] flex items-center justify-center shrink-0 border border-[#E8DFC9] mt-0.5">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Depart from provider service location</p>
                          <p className="text-[10px] text-slate-500">Head out onto main neighborhood corridor</p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-[#C6511F] flex items-center justify-center shrink-0 border border-[#E8DFC9] mt-0.5">
                          <CornerUpRight className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Follow road route to customer neighborhood</p>
                          <p className="text-[10px] text-slate-500">Approx. {distanceKm || '2.5'} km along city road network</p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-emerald-600 flex items-center justify-center shrink-0 border border-[#E8DFC9] mt-0.5">
                          <Flag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Arrive at customer delivery destination</p>
                          <p className="text-[10px] text-slate-500">{booking?.customerAddress || 'Customer Address'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* External GPS Open Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Open in Google Maps Navigation ↗</span>
              </a>
            </div>
          )}

          {/* TAB 2: JOB DETAILS & PROVIDER CONTROLS */}
          {activeSideTab === 'details' && (
            <div className="space-y-4">
              {/* Status Stepper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Service Pipeline
                  </span>
                  <StatusBadge status={booking?.status} />
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DFC9] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-700">1. Booked</span>
                    <span className={booking?.status !== 'pending' ? 'text-emerald-700' : 'text-slate-400'}>
                      2. Confirmed
                    </span>
                    <span
                      className={
                        booking?.status === 'in_progress' || isCompleted
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
                          : booking?.status === 'in_progress'
                          ? 'w-3/4 bg-[#C6511F]'
                          : booking?.status === 'confirmed'
                          ? 'w-1/2 bg-[#5C7A5C]'
                          : 'w-1/4 bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Provider Profile Card */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8DFC9] overflow-hidden border border-[#D6C7B2] shrink-0">
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
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {provider.businessName || 'Service Provider'}
                    </h4>
                    <p className="text-xs text-slate-500 capitalize">{provider.category} Pro</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {provider.rating?.avg ? provider.rating.avg.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

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
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                  Customer Destination
                </span>
                <div className="flex items-start gap-2 text-slate-800 font-medium">
                  <MapPin className="w-4 h-4 text-[#C6511F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">
                      {booking?.customerAddress || customer.address || 'Address provided'}
                    </p>
                    {(booking?.customerPincode || customer.pincode) && (
                      <p className="text-[11px] text-slate-500">
                        PIN: {booking.customerPincode || customer.pincode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Hardware GPS Controls (Bottom action for assigned provider) */}
          {isProvider && !isCompleted && !isCancelled && (
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#C6511F]" />
                  Provider GPS Controls
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">Active Session</span>
              </div>

              {gpsError && (
                <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
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
                    <span>Start GPS Nav</span>
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

          {/* Pricing Info Footer */}
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
