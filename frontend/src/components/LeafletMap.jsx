import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Category color configurations for map marker pins
const CATEGORY_COLORS = {
  plumber: '#2563eb', // blue
  electrician: '#f59e0b', // amber
  tutor: '#10b981', // emerald
  tiffin: '#f97316', // orange
  cleaner: '#06b6d4', // cyan
  other: '#8b5cf6', // purple
};

const LeafletMap = ({
  providers = [],
  userLocation = null,
  selectedProvider = null,
  onSelectProvider = () => {},
  className = 'h-[500px] w-full',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Bangalore) if no user location
    const defaultCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [12.9716, 77.5946];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create a layer group for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && userLocation.lat && userLocation.lng) {
      const userIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup(`<b>You are here</b><br/>Live Geolocation active`);
      }

      // Pan to user location if no provider selected
      if (!selectedProvider) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
    }
  }, [userLocation]);

  // Update Provider Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear old markers
    markersLayer.clearLayers();

    const bounds = [];

    if (userLocation && userLocation.lat) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    providers.forEach((provider) => {
      if (!provider.location || !provider.location.coordinates) return;

      const [lng, lat] = provider.location.coordinates;
      bounds.push([lat, lng]);

      const pinColor = CATEGORY_COLORS[provider.category] || '#6366f1';
      const isSelected = selectedProvider && selectedProvider._id === provider._id;

      // Custom SVG Pin HTML
      const markerHtml = `
        <div style="
          background-color: ${pinColor};
          color: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border: 2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)'};
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        ">
          <span>₹${provider.pricing?.amount}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-provider-pin',
        html: markerHtml,
        iconSize: [60, 30],
        iconAnchor: [30, 15],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer);

      // Popup Content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1';
      popupContent.innerHTML = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: ${pinColor}; background: ${pinColor}15; padding: 2px 6px; border-radius: 4px;">
              ${provider.category}
            </span>
            <span style="font-size: 11px; font-weight: 600; color: #eab308;">
              ★ ${provider.rating?.avg || 'New'}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; margin: 0 0 4px 0; color: #1e293b;">
            ${provider.businessName}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0; line-height: 1.3;">
            ${provider.address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <span style="font-size: 12px; font-weight: 800; color: #0f172a;">
              ₹${provider.pricing?.amount} <small style="font-weight: 400; color: #64748b;">/${provider.pricing?.type || 'hr'}</small>
            </span>
            <a href="/provider/${provider._id}" style="font-size: 11px; font-weight: 600; color: #4f46e5; text-decoration: none; padding: 2px 8px; background: #eef2ff; border-radius: 4px;">
              View →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectProvider(provider);
      });
    });

    // If we have markers, fit bounds nicely
    if (bounds.length > 1 && !selectedProvider) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [providers, selectedProvider]);

  // Center on selected provider
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedProvider?.location?.coordinates) {
      const [lng, lat] = selectedProvider.location.coordinates;
      map.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [selectedProvider]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      <div ref={mapContainerRef} className={className} />
    </div>
  );
};

export default LeafletMap;
