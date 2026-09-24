import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { providerService } from '../services/api';
import {
  getUserCoordinates,
  CITY_PRESETS,
  CATEGORIES,
} from '../utils/geo';
import LeafletMap from '../components/LeafletMap';
import ProviderCard from '../components/ProviderCard';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  Loader2,
  RefreshCw,
  Layers,
  Map,
  List,
} from 'lucide-react';

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & State
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [radius, setRadius] = useState(15); // default 15km
  const [sortBy, setSortBy] = useState('distance'); // distance, rating, price_asc, price_desc

  // Geolocation State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locationStatus, setLocationStatus] = useState('prompt'); // prompt, success, denied, fallback
  const [locationName, setLocationName] = useState('Bengaluru (Default)');

  // Providers & UI State
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split'); // split, map, list

  // Fetch live user coordinates
  const handleRequestLocation = useCallback(async () => {
    setLocationStatus('loading');
    setError('');
    try {
      const coords = await getUserCoordinates();
      setUserLocation({ lat: coords.lat, lng: coords.lng });
      setLocationStatus('success');
      setLocationName('Live Geolocation');
    } catch (err) {
      console.warn('Geolocation failed:', err.message);
      setLocationStatus('denied');
      // Set Bangalore default coordinates
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
      setLocationName('Bengaluru (City Preset)');
    }
  }, []);

  // Initialize location on mount
  useEffect(() => {
    handleRequestLocation();
  }, [handleRequestLocation]);

  // Load nearby providers from backend whenever filters or coordinates change
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
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
        setProviders(res.providers || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch providers.');
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, radius, sortBy, userLocation]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // City preset selection handler
  const handleSelectCityPreset = (city) => {
    setUserLocation({ lat: city.lat, lng: city.lng });
    setLocationName(city.name);
    setLocationStatus('success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Filter and Search Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          {/* Main search and location row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by provider name, specialty, or area..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all border border-transparent focus:border-indigo-500"
              />
            </div>

            {/* Location Selector & Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-800">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {locationName}
                </span>
                <button
                  onClick={handleRequestLocation}
                  title="Detect live GPS location"
                  className="ml-1 p-1 hover:bg-indigo-200/60 rounded-md transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 text-indigo-700 ${
                      locationStatus === 'loading' ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>

              {/* City Switcher Dropdown */}
              <select
                onChange={(e) => {
                  const city = CITY_PRESETS.find((c) => c.name === e.target.value);
                  if (city) handleSelectCityPreset(city);
                }}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="">Switch City / Hub</option>
                {CITY_PRESETS.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>

              {/* Radius Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Radius: {radius} km</span>
                <input
                  type="range"
                  min="3"
                  max="50"
                  step="2"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* View Mode Toggle (Mobile / Desktop) */}
              <div className="hidden sm:flex items-center bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'split'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {locationStatus === 'denied' && (
          <div className="mb-4 flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Geolocation permission was not granted. We are showing results around <b>{locationName}</b>. You can switch hubs above.
              </span>
            </div>
          </div>
        )}

        {/* Layout based on viewMode */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of Providers */}
          <div
            className={`${
              viewMode === 'map'
                ? 'hidden'
                : viewMode === 'list'
                ? 'lg:col-span-12'
                : 'lg:col-span-7'
            } space-y-4`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                {category === 'all'
                  ? 'All Local Professionals'
                  : `${CATEGORIES.find((c) => c.id === category)?.label || ''}`}
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                  {providers.length} found
                </span>
              </h2>

              <span className="text-xs text-slate-400">
                Within {radius} km radius
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-72 bg-white rounded-2xl animate-pulse border border-slate-200"
                  />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No providers found within {radius} km
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try widening your radius search, selecting "All Services", or picking another neighborhood hub.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setRadius(35)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
                  >
                    Increase Radius to 35 km
                  </button>
                  <button
                    onClick={() => {
                      setCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Reset Filters
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
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-md">
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
