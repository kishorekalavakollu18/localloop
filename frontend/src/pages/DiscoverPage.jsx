import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { providerService } from '../services/api';
import {
  getUserCoordinates,
  CITY_PRESETS,
  CATEGORIES,
  POPULAR_PINCODES,
  resolvePincode,
  extractPincode,
  calculateDistanceKm,
  calculateAccurateDistance,
} from '../utils/geo';
import LeafletMap from '../components/LeafletMap';
import ProviderCard from '../components/ProviderCard';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & State
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [radius, setRadius] = useState(50); // default 50km
  const [sortBy, setSortBy] = useState('distance'); // distance, rating, price_asc, price_desc
  const [fallbackInfo, setFallbackInfo] = useState('');

  // Pincode & Geolocation State
  const [userPincode, setUserPincode] = useState(() => localStorage.getItem('localloop_pincode') || '560038');
  const [pincodeInput, setPincodeInput] = useState(() => localStorage.getItem('localloop_pincode') || '560038');
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('localloop_pincode') || '560038';
    const resolved = resolvePincode(saved) || resolvePincode('560038');
    return { lat: resolved.lat, lng: resolved.lng };
  });
  const [locationStatus, setLocationStatus] = useState('success');
  const [locationName, setLocationName] = useState(() => {
    const saved = localStorage.getItem('localloop_pincode') || '560038';
    const resolved = resolvePincode(saved) || resolvePincode('560038');
    return `${resolved.name} (${resolved.pincode})`;
  });
  const [isCrossCityNotice, setIsCrossCityNotice] = useState(false);

  // Providers & UI State
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split'); // split, map, list

  // Apply Pincode helper
  const handleApplyPincode = (pincodeToApply) => {
    const code = (pincodeToApply || pincodeInput || '').trim();
    if (!code) return;
    const resolved = resolvePincode(code);
    if (resolved) {
      setUserLocation({ lat: resolved.lat, lng: resolved.lng });
      setUserPincode(resolved.pincode);
      setPincodeInput(resolved.pincode);
      setLocationName(`${resolved.name} (${resolved.pincode})`);
      setLocationStatus('success');
      setIsCrossCityNotice(false);
      localStorage.setItem('localloop_pincode', resolved.pincode);
    } else {
      alert(`Pincode "${code}" not found in local index. Please enter a valid 6-digit Indian postal code (e.g. 560038, 560095).`);
    }
  };

  // Fetch live user coordinates with GPS
  const handleRequestLocation = useCallback(async () => {
    setLocationStatus('loading');
    setError('');
    try {
      const coords = await getUserCoordinates();
      // Check if distance from Bengaluru cluster center is > 50km
      const distFromBangalore = calculateDistanceKm(coords.lat, coords.lng, 12.9716, 77.5946);
      if (distFromBangalore && distFromBangalore > 50) {
        setIsCrossCityNotice(true);
        // Keep search centered on user's selected neighborhood pincode for accurate local distances (0.8-5 km)
        const resolved = resolvePincode(userPincode) || resolvePincode('560038');
        setUserLocation({ lat: resolved.lat, lng: resolved.lng });
        setLocationName(`${resolved.name} (${resolved.pincode})`);
        setLocationStatus('success');
      } else {
        setIsCrossCityNotice(false);
        setUserLocation({ lat: coords.lat, lng: coords.lng });
        setLocationStatus('success');
        setLocationName('Live Geolocation');
      }
    } catch (err) {
      console.warn('Geolocation fallback:', err.message);
      setLocationStatus('denied');
      const resolved = resolvePincode(userPincode) || resolvePincode('560038');
      setUserLocation({ lat: resolved.lat, lng: resolved.lng });
      setLocationName(`${resolved.name} (${resolved.pincode})`);
    }
  }, [userPincode]);

  // Load nearby providers from backend
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    setFallbackInfo('');
    try {
      const params = {
        category: category !== 'all' ? category : undefined,
        search: searchQuery.trim() || undefined,
        radius,
        sort: sortBy,
      };

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await providerService.getNearby(params);
      if (res.success) {
        const rawProviders = res.providers || [];
        const mapped = rawProviders.map((p) => {
          const exactDist = calculateAccurateDistance(userLocation, userPincode, p);
          return {
            ...p,
            distanceKm: exactDist !== null && exactDist !== undefined ? exactDist : p.distanceKm,
          };
        });

        // Re-sort if sorted by distance
        if (sortBy === 'distance') {
          mapped.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
        }

        setProviders(mapped);
        if (res.fallbackMessage) {
          setFallbackInfo(res.fallbackMessage);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch providers.');
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, radius, sortBy, userLocation, userPincode]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSelectCityPreset = (city) => {
    setUserLocation({ lat: city.lat, lng: city.lng });
    setLocationName(city.name);
    if (city.pincode) {
      setUserPincode(city.pincode);
      setPincodeInput(city.pincode);
      localStorage.setItem('localloop_pincode', city.pincode);
    }
    setLocationStatus('success');
    setIsCrossCityNotice(false);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col">
      {/* Top Filter and Search Control Bar */}
      <div className="sticky top-16 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8DFC9] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#C6511F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by provider name, service, skill, or address..."
                className="w-full pl-10 pr-4 py-2 bg-[#F2EBDC] rounded-xl text-xs font-semibold text-[#2B2621] placeholder:text-[#8C8275] focus:bg-white focus:ring-2 focus:ring-[#C6511F] focus:outline-hidden transition-all border border-[#E8DFC9]"
              />
            </div>

            {/* Location Selector & Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7EBE5] border border-[#F0D5C9] rounded-xl text-xs font-bold text-[#C6511F]">
                <MapPin className="w-3.5 h-3.5 fill-[#C6511F] text-[#F7EBE5] shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {locationName}
                </span>
                <button
                  onClick={handleRequestLocation}
                  title="Detect live GPS location"
                  className="ml-1 p-1 hover:bg-[#F0D5C9] rounded-md transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 text-[#C6511F] ${
                      locationStatus === 'loading' ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>

              {/* City Switcher */}
              <select
                onChange={(e) => {
                  const city = CITY_PRESETS.find((c) => c.name === e.target.value);
                  if (city) handleSelectCityPreset(city);
                }}
                className="px-3 py-2 bg-[#F2EBDC] border border-[#E8DFC9] rounded-xl text-xs font-bold text-[#2B2621] focus:outline-hidden cursor-pointer"
              >
                <option value="">Switch City / Hub</option>
                {CITY_PRESETS.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>

              {/* Radius Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F2EBDC] border border-[#E8DFC9] rounded-xl text-xs font-bold text-[#2B2621]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C6511F]" />
                <span>Radius: {radius >= 100 ? 'All Distances' : `${radius} km`}</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-[#C6511F] cursor-pointer"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#F2EBDC] border border-[#E8DFC9] rounded-xl text-xs font-bold text-[#2B2621] focus:outline-hidden cursor-pointer"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-[#E8DFC9] p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'split'
                      ? 'bg-white text-[#C6511F] shadow-xs'
                      : 'text-[#5C5346] hover:text-[#2B2621]'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-[#C6511F] shadow-xs'
                      : 'text-[#5C5346] hover:text-[#2B2621]'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-[#C6511F] shadow-xs'
                      : 'text-[#5C5346] hover:text-[#2B2621]'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Pincode Distance Tracker Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2EBDC] px-3.5 py-2.5 rounded-2xl border border-[#E8DFC9]">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-[#2B2621] flex items-center gap-1.5 whitespace-nowrap">
                <MapPin className="w-4 h-4 text-[#C6511F]" />
                Your Pincode:
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleApplyPincode();
                }}
                className="flex items-center gap-1.5 flex-1 max-w-xs"
              >
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 560038"
                  className="w-24 sm:w-28 px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-[#2B2621] border border-[#E8DFC9] focus:outline-hidden focus:ring-2 focus:ring-[#C6511F]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#C6511F] hover:bg-[#B04316] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Track Distance
                </button>
              </form>
            </div>

            {/* Quick Pincode Hubs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              <span className="text-[#8C8275] hidden sm:inline">Neighborhood Hubs:</span>
              {POPULAR_PINCODES.map((hub) => (
                <button
                  key={hub.pincode}
                  onClick={() => handleApplyPincode(hub.pincode)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    userPincode === hub.pincode
                      ? 'bg-[#C6511F] text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#2B2621] border border-[#E8DFC9]'
                  }`}
                >
                  {hub.name} ({hub.pincode})
                </button>
              ))}
            </div>
          </div>

          {/* Cross-City Notification Notice */}
          {isCrossCityNotice && (
            <div className="bg-[#FFF8EE] border border-[#F4DCB5] px-4 py-2.5 rounded-2xl text-xs text-[#B87719] flex items-center justify-between gap-3 font-medium">
              <span>
                📍 Live GPS is outside Bengaluru. Distances are calculated accurately for <strong>{locationName}</strong> (0.8–5 km). Type your pincode above to adjust.
              </span>
              <button
                onClick={() => setIsCrossCityNotice(false)}
                className="text-xs font-bold underline shrink-0 hover:text-[#2B2621]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  category === cat.id
                    ? 'bg-[#C6511F] text-white shadow-md shadow-[#C6511F]/20'
                    : 'bg-[#F2EBDC] text-[#5C5346] hover:bg-[#E8DFC9] hover:text-[#2B2621]'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Discover Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {fallbackInfo && (
          <div className="mb-4 flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C6511F] shrink-0" />
              <span>{fallbackInfo}</span>
            </div>
            <button
              onClick={() => {
                setCategory('all');
                setSearchQuery('');
                setRadius(100);
              }}
              className="text-[11px] font-bold text-[#C6511F] hover:underline shrink-0"
            >
              Show All Services →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Provider Cards Column */}
          <div
            className={`${
              viewMode === 'map'
                ? 'hidden'
                : viewMode === 'list'
                ? 'lg:col-span-12'
                : 'lg:col-span-7'
            } space-y-4`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-extrabold text-[#2B2621]">
                {category === 'all'
                  ? 'All Neighborhood Professionals'
                  : `${CATEGORIES.find((c) => c.id === category)?.label || ''}`}
                <span className="ml-2 text-xs font-bold px-2.5 py-0.5 bg-[#E8DFC9] text-[#2B2621] rounded-full">
                  {providers.length} found
                </span>
              </h2>

              <span className="text-xs text-[#8C8275] font-semibold">
                {radius >= 100 ? 'All City Distances' : `Within ${radius} km`}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-72 bg-white rounded-3xl animate-pulse border border-[#E8DFC9]"
                  />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="bg-[#FFFDF9] rounded-3xl p-10 text-center border-2 border-[#E8DFC9] space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-[#F7EBE5] text-[#C6511F] rounded-2xl flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-heading font-extrabold text-[#2B2621]">
                  No matching providers found
                </h3>
                <p className="text-xs text-[#6B6153] max-w-md mx-auto">
                  Click below to view all available neighborhood service providers.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCategory('all');
                      setSearchQuery('');
                      setRadius(100);
                    }}
                    className="px-5 py-2.5 bg-[#C6511F] text-white rounded-full text-xs font-bold shadow-md shadow-[#C6511F]/20 hover:bg-[#A84116]"
                  >
                    View All Services & Professionals
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  viewMode === 'list'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    isSelected={selectedProvider?._id === provider._id}
                    onHover={(p) => setSelectedProvider(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Leaflet Map Column */}
          <div
            className={`${
              viewMode === 'list'
                ? 'hidden'
                : viewMode === 'map'
                ? 'lg:col-span-12 h-[75vh]'
                : 'lg:col-span-5 sticky top-40'
            }`}
          >
            <div className="bg-[#FFFDF9] p-2.5 rounded-3xl border-2 border-[#E8DFC9] shadow-md">
              <LeafletMap
                providers={providers}
                userLocation={userLocation}
                selectedProvider={selectedProvider}
                onSelectProvider={(p) => setSelectedProvider(p)}
                className="h-[600px] w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
