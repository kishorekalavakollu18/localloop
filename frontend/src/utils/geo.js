// Preset popular neighborhood locations for easy demonstration and fallback
export const CITY_PRESETS = [
  { name: 'Bengaluru (Indiranagar / Koramangala)', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai (Bandra / Andheri)', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi NCR (Connaught / South Delhi)', lat: 28.6139, lng: 77.209 },
  { name: 'Hyderabad (Hitec City / Jubilee)', lat: 17.385, lng: 78.4867 },
  { name: 'Pune (Koregaon Park)', lat: 18.5204, lng: 73.8567 },
  { name: 'Chennai (T. Nagar / Adyar)', lat: 13.0827, lng: 80.2707 },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: 'Sparkles', color: 'bg-[#C6511F] text-white' },
  { id: 'plumber', label: 'Plumbers', icon: 'Wrench', color: 'bg-[#C6511F] text-white', stampBg: 'bg-[#F9EBE5] text-[#C6511F] border-[#E8C5B7]' },
  { id: 'electrician', label: 'Electricians', icon: 'Zap', color: 'bg-[#E8A33D] text-[#2B2621]', stampBg: 'bg-[#FDF4E5] text-[#B87719] border-[#F4DCB5]' },
  { id: 'tutor', label: 'Tutors & Teachers', icon: 'GraduationCap', color: 'bg-[#5C7A5C] text-white', stampBg: 'bg-[#EDF2ED] text-[#425942] border-[#C2D4C2]' },
  { id: 'tiffin', label: 'Home Tiffin / Food', icon: 'Utensils', color: 'bg-[#D96B27] text-white', stampBg: 'bg-[#FAF0E8] text-[#B54C0C] border-[#F2CBB2]' },
  { id: 'cleaner', label: 'Cleaners & Maid', icon: 'Sparkles', color: 'bg-[#485935] text-white', stampBg: 'bg-[#EFF2ED] text-[#344225] border-[#C6D4C0]' },
  { id: 'other', label: 'Appliance & Repair', icon: 'Cpu', color: 'bg-[#2B2621] text-white', stampBg: 'bg-[#EFECE8] text-[#2B2621] border-[#D6CEC4]' },
];

// Live Activity Ticker Mock Feeds
export const LIVE_ACTIVITY_TICKER = [
  '📍 Priya just booked a tutor in HSR Layout Sector 3',
  '⭐ Ramesh\'s HydroTech plumbing received a 5.0★ review in Indiranagar',
  '⚡ Anil Spark replaced an MCB panel in Koramangala 5th Block',
  '🍱 Annapurna Tiffin dispatched 12 hot meal boxes in BTM Layout',
  '🧹 SparklePro completed deep cleaning in MG Road Ashok Nagar',
  '🎓 Neha Math Tutoring started a weekend batch in South Delhi',
  '🔧 QuickFix AC recharged gas for a refrigerator in Whitefield',
  '📍 Rahul confirmed a plumbing inspection slot for tomorrow 9 AM',
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
        if (error.code === 1) msg = 'Location permission was denied. Select a city below.';
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
