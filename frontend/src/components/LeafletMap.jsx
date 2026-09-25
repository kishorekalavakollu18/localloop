import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Category color configurations for map marker pins (Terracotta & Artisanal Warm Palette)
const CATEGORY_COLORS = {
  plumber: '#C6511F', // Terracotta
  electrician: '#E8A33D', // Mustard
  tutor: '#5C7A5C', // Moss Green
  tiffin: '#D96B27', // Warm Orange
  cleaner: '#485935', // Olive
  other: '#2B2621', // Charcoal
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

    const defaultCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [12.9716, 77.5946];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

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
        html: `<div style="width: 16px; height: 16px; background: #C6511F; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(198,81,31,0.8);"></div>`,
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
          .bindPopup(`<b>Your Neighborhood GPS</b><br/>Live location active`);
      }

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

    markersLayer.clearLayers();
    const bounds = [];

    if (userLocation && userLocation.lat) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    providers.forEach((provider) => {
      if (!provider.location || !provider.location.coordinates) return;

      const [lng, lat] = provider.location.coordinates;
      bounds.push([lat, lng]);

      const pinColor = CATEGORY_COLORS[provider.category] || '#C6511F';
      const isSelected = selectedProvider && selectedProvider._id === provider._id;

      const markerHtml = `
        <div style="
          background-color: ${pinColor};
          color: white;
          padding: 6px 11px;
          border-radius: 20px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 6px 16px rgba(43,38,33,0.3);
          border: 2px solid ${isSelected ? '#FFFDF9' : 'rgba(255,253,249,0.85)'};
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

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1';
      popupContent.innerHTML = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: ${pinColor}; background: ${pinColor}15; padding: 2px 6px; border-radius: 4px;">
              ${provider.category}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #E8A33D;">
              ★ ${provider.rating?.avg || 'New'}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; color: #2B2621;">
            ${provider.businessName}
          </h4>
          <p style="font-size: 11px; color: #6B6153; margin: 0 0 6px 0; line-height: 1.3;">
            ${provider.address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #E8DFC9;">
            <span style="font-size: 12px; font-weight: 800; color: #2B2621;">
              ₹${provider.pricing?.amount} <small style="font-weight: 500; color: #8C8275;">/${provider.pricing?.type || 'hr'}</small>
            </span>
            <a href="/provider/${provider._id}" style="font-size: 11px; font-weight: 800; color: #C6511F; text-decoration: none; padding: 3px 10px; background: #F7EBE5; border-radius: 6px;">
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

    if (bounds.length > 1 && !selectedProvider) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedProvider?.location?.coordinates) {
      const [lng, lat] = selectedProvider.location.coordinates;
      map.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [selectedProvider]);

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-[#E8DFC9] shadow-md bg-[#F2EBDC]">
      <div ref={mapContainerRef} className={className} />
    </div>
  );
};

export default LeafletMap;
