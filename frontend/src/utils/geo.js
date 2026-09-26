// Preset popular neighborhood locations for easy demonstration and fallback
export const CITY_PRESETS = [
  { name: 'Bengaluru (Indiranagar / Koramangala)', lat: 12.9716, lng: 77.5946, pincode: '560038' },
  { name: 'Mumbai (Bandra / Andheri)', lat: 19.076, lng: 72.8777, pincode: '400050' },
  { name: 'Delhi NCR (Connaught / South Delhi)', lat: 28.6139, lng: 77.209, pincode: '110001' },
  { name: 'Hyderabad (Hitec City / Jubilee)', lat: 17.385, lng: 78.4867, pincode: '500081' },
  { name: 'Pune (Koregaon Park)', lat: 18.5204, lng: 73.8567, pincode: '411001' },
  { name: 'Chennai (T. Nagar / Adyar)', lat: 13.0827, lng: 80.2707, pincode: '600017' },
];

// Comprehensive Indian Pincode Database for accurate local neighborhood tracking
export const INDIAN_PINCODES = {
  // Bengaluru Neighborhoods
  '560038': { name: 'Indiranagar / HAL 2nd Stage', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  '560095': { name: 'Koramangala 5th/6th Block', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  '560034': { name: 'Koramangala 1st/3rd Block', city: 'Bengaluru', lat: 12.9344, lng: 77.6310 },
  '560102': { name: 'HSR Layout (Sectors 1-7)', city: 'Bengaluru', lat: 12.9121, lng: 77.6387 },
  '560076': { name: 'BTM Layout (1st/2nd Stage)', city: 'Bengaluru', lat: 12.9165, lng: 77.6101 },
  '560001': { name: 'MG Road / Ashok Nagar / Central', city: 'Bengaluru', lat: 12.9752, lng: 77.6033 },
  '560066': { name: 'Whitefield / ITPL', city: 'Bengaluru', lat: 12.9698, lng: 77.7499 },
  '560004': { name: 'Basavanagudi / VV Puram', city: 'Bengaluru', lat: 12.9438, lng: 77.5738 },
  '560003': { name: 'Malleshwaram / Vyalikaval', city: 'Bengaluru', lat: 13.0031, lng: 77.5643 },
  '560078': { name: 'JP Nagar (Phases 1-6)', city: 'Bengaluru', lat: 12.9063, lng: 77.5857 },
  '560100': { name: 'Electronic City Phase 1 & 2', city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  '560037': { name: 'Marathahalli / Kundalahalli', city: 'Bengaluru', lat: 12.9591, lng: 77.6974 },
  '560011': { name: 'Jayanagar (Blocks 1-9)', city: 'Bengaluru', lat: 12.9308, lng: 77.5838 },
  '560029': { name: 'Dairy Circle / SG Palya', city: 'Bengaluru', lat: 12.9345, lng: 77.6012 },
  '560025': { name: 'Richmond Town / Victoria Layout', city: 'Bengaluru', lat: 12.9620, lng: 77.6010 },
  '560047': { name: 'Austin Town / Neelasandra', city: 'Bengaluru', lat: 12.9610, lng: 77.6150 },
  '560068': { name: 'Madiwala / Bommanahalli', city: 'Bengaluru', lat: 12.9226, lng: 77.6174 },
  '560085': { name: 'Banashankari 3rd Stage', city: 'Bengaluru', lat: 12.9255, lng: 77.5468 },
  '560002': { name: 'Bangalore City / Chickpet', city: 'Bengaluru', lat: 12.9650, lng: 77.5820 },
  '560008': { name: 'Ulsoor / Cambridge Layout', city: 'Bengaluru', lat: 12.9796, lng: 77.6253 },
  '560017': { name: 'HAL Old Airport Road', city: 'Bengaluru', lat: 12.9555, lng: 77.6645 },
  '560043': { name: 'Kalyan Nagar / Banaswadi', city: 'Bengaluru', lat: 13.0238, lng: 77.6433 },
  '560092': { name: 'Sahakar Nagar / Hebbal', city: 'Bengaluru', lat: 13.0645, lng: 77.5898 },
  '560064': { name: 'Yelahanka Satellite Town', city: 'Bengaluru', lat: 13.1007, lng: 77.5963 },

  // Andhra Pradesh & Telangana
  '517501': { name: 'Tirupati Central', city: 'Tirupati', lat: 13.6288, lng: 79.4192 },
  '517507': { name: 'Tirupati SVU Area', city: 'Tirupati', lat: 13.6300, lng: 79.4200 },
  '520001': { name: 'Vijayawada One Town', city: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
  '520010': { name: 'Vijayawada Benz Circle', city: 'Vijayawada', lat: 16.4975, lng: 80.6550 },
  '530001': { name: 'Visakhapatnam Town', city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  '522001': { name: 'Guntur Central', city: 'Guntur', lat: 16.3067, lng: 80.4365 },
  '524001': { name: 'Nellore Central', city: 'Nellore', lat: 14.4426, lng: 79.9865 },
  '518001': { name: 'Kurnool Town', city: 'Kurnool', lat: 15.8281, lng: 78.0373 },
  '515001': { name: 'Anantapur Clock Tower', city: 'Anantapur', lat: 14.6819, lng: 77.6006 },
  '516001': { name: 'Kadapa Central', city: 'Kadapa', lat: 14.4673, lng: 78.8242 },
  '500081': { name: 'Hyderabad Hitec City / Madhapur', city: 'Hyderabad', lat: 17.4474, lng: 78.3762 },
  '500034': { name: 'Hyderabad Banjara Hills', city: 'Hyderabad', lat: 17.4156, lng: 78.4354 },
  '500032': { name: 'Hyderabad Gachibowli', city: 'Hyderabad', lat: 17.4401, lng: 78.3489 },

  // Other Major Cities
  '400050': { name: 'Mumbai Bandra West', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  '400053': { name: 'Mumbai Andheri West', city: 'Mumbai', lat: 19.1136, lng: 72.8697 },
  '110001': { name: 'New Delhi Connaught Place', city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  '600017': { name: 'Chennai T. Nagar', city: 'Chennai', lat: 13.0418, lng: 80.2341 },
  '411001': { name: 'Pune Camp / Station', city: 'Pune', lat: 18.5196, lng: 73.8753 },
};

// Quick Select Pincode Hubs
export const POPULAR_PINCODES = [
  { pincode: '560038', name: 'Indiranagar' },
  { pincode: '560095', name: 'Koramangala' },
  { pincode: '560102', name: 'HSR Layout' },
  { pincode: '560076', name: 'BTM Layout' },
  { pincode: '560001', name: 'MG Road' },
  { pincode: '560066', name: 'Whitefield' },
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
  '📍 Priya just booked a tutor in HSR Layout (560102)',
  '⭐ Ramesh\'s HydroTech plumbing received a 5.0★ review in Indiranagar (560038)',
  '⚡ Anil Spark replaced an MCB panel in Koramangala 5th Block (560095)',
  '🍱 Annapurna Tiffin dispatched 12 hot meal boxes in BTM Layout (560076)',
  '🧹 SparklePro completed deep cleaning in MG Road Ashok Nagar (560001)',
  '🎓 Neha Math Tutoring started a weekend batch in HSR Layout',
  '🔧 QuickFix AC recharged gas in Whitefield (560066)',
  '📍 Rahul confirmed a plumbing inspection slot for tomorrow 9 AM',
];

// Extract 6-digit Indian pincode from an address string
export const extractPincode = (address) => {
  if (!address || typeof address !== 'string') return null;
  const match = address.match(/\b[1-9][0-9]{5}\b/);
  return match ? match[0] : null;
};

// Resolve pincode to coordinates and neighborhood info
export const resolvePincode = (pincode) => {
  if (!pincode) return null;
  const cleanCode = pincode.toString().trim();
  if (INDIAN_PINCODES[cleanCode]) {
    return {
      pincode: cleanCode,
      ...INDIAN_PINCODES[cleanCode],
    };
  }

  // Fallback heuristic for unlisted Bangalore 560xxx pincodes
  if (cleanCode.startsWith('560')) {
    return {
      pincode: cleanCode,
      name: `Bangalore Zone (${cleanCode})`,
      city: 'Bengaluru',
      lat: 12.9716,
      lng: 77.5946,
    };
  }

  return null;
};

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
        if (error.code === 1) msg = 'Location permission was denied. Select a city or pincode below.';
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

// Calculate accurate distance using user's entered Pincode & coordinates
export const calculateAccurateDistance = (userLocation, userPincode, provider) => {
  if (!provider) return null;

  const provPincode = extractPincode(provider.address);
  const provLat = provider.location?.coordinates?.[1];
  const provLng = provider.location?.coordinates?.[0];

  // 1. If user entered a pincode and it matches the provider's pincode exactly:
  if (userPincode && provPincode && userPincode.trim() === provPincode.trim()) {
    return 0.8; // Immediate walking distance within the same pincode
  }

  // 2. If userLocation has lat and lng, compute exact Haversine distance
  if (userLocation && userLocation.lat && userLocation.lng && provLat && provLng) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, provLat, provLng);
    return dist;
  }

  // 3. Fallback to precalculated distance or default
  return provider.distanceKm !== undefined ? provider.distanceKm : null;
};
