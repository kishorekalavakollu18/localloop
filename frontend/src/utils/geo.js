// Preset popular locations for easy demonstration and fallback
export const CITY_PRESETS = [
  { name: 'Bengaluru (Indiranagar/Koramangala)', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai (Bandra/Andheri)', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi NCR (Connaught/South Delhi)', lat: 28.6139, lng: 77.209 },
  { name: 'Hyderabad (Hitec City)', lat: 17.385, lng: 78.4867 },
  { name: 'Pune (Koregaon Park)', lat: 18.5204, lng: 73.8567 },
  { name: 'Chennai (T. Nagar)', lat: 13.0827, lng: 80.2707 },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: 'Sparkles', color: 'bg-indigo-500' },
  { id: 'plumber', label: 'Plumbers', icon: 'Wrench', color: 'bg-blue-500' },
  { id: 'electrician', label: 'Electricians', icon: 'Zap', color: 'bg-amber-500' },
  { id: 'tutor', label: 'Tutors & Teachers', icon: 'GraduationCap', color: 'bg-emerald-500' },
  { id: 'tiffin', label: 'Tiffin / Home Food', icon: 'Utensils', color: 'bg-orange-500' },
  { id: 'cleaner', label: 'Cleaners & Maid', icon: 'Sparkles', color: 'bg-cyan-500' },
  { id: 'other', label: 'Appliance & Others', icon: 'Cpu', color: 'bg-purple-500' },
];

// Get user live location with geolocation API
export const getUserCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === 1) msg = 'Location permission was denied. Please select a city or search manually.';
        if (error.code === 2) msg = 'Location position unavailable.';
        if (error.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

// Calculate Haversine distance in Kilometers
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
};
