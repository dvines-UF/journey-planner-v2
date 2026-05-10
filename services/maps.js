import { eventBus } from '../core/eventBus.js';

let mapInstance = null;
let currentMarker = null;
let activeMode = 'Auto'; // Default mode

// Map our custom modes to Google Maps travel modes
const transportModes = {
  '🥾 Hiking': 'walking',
  '🚆 Train': 'transit',
  '🚲 Cycling': 'bicycling',
  '🚗 Auto': 'driving',
  '🚢 Ferry': 'transit' // Transit is closest for Ferry in GMaps generic routing
};

// State to hold locations for routing
let originCoords = null; // Could be a previous city
let destCoords = null;

function loadGoogleMapsAPI(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function updateBadgeUI(container) {
  let badge = document.getElementById('transport-mode-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'transport-mode-badge';
    badge.style.position = 'absolute';
    badge.style.top = '10px';
    badge.style.left = '10px';
    badge.style.zIndex = '1000'; // Above map
    badge.style.backgroundColor = '#ffffff';
    badge.style.padding = '8px 12px';
    badge.style.borderRadius = '20px';
    badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    badge.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    badge.style.fontWeight = 'bold';
    badge.style.cursor = 'pointer';
    // Make container relative so absolute positioning works
    container.style.position = 'relative';
    container.appendChild(badge);

    // Simple toggle for demonstration
    badge.addEventListener('click', () => {
      const modes = Object.keys(transportModes);
      const currentIndex = modes.findIndex(m => m.includes(activeMode));
      const nextIndex = (currentIndex + 1) % modes.length;
      activeMode = modes[nextIndex].split(' ')[1]; // Extract just the word
      updateBadgeUI(container);
    });
  }

  // Find full string matching the active mode
  const fullModeString = Object.keys(transportModes).find(m => m.includes(activeMode)) || '🚗 Auto';
  badge.textContent = `Mode: ${fullModeString}`;
}

function createRoutingButton(container) {
  let btn = document.getElementById('route-maps-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'route-maps-btn';
    btn.style.position = 'absolute';
    btn.style.bottom = '20px';
    btn.style.right = '10px';
    btn.style.zIndex = '1000';
    btn.style.backgroundColor = '#4285F4';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '10px 16px';
    btn.style.borderRadius = '8px';
    btn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    btn.textContent = 'Open in Google Maps';

    btn.addEventListener('click', () => {
      if (!destCoords) {
        alert('Please select a destination city first.');
        return;
      }

      const destQuery = `${destCoords.lat},${destCoords.lon}`;
      const originQuery = originCoords ? `${originCoords.lat},${originCoords.lon}` : '';

      const fullModeString = Object.keys(transportModes).find(m => m.includes(activeMode)) || '🚗 Auto';
      const gmapsMode = transportModes[fullModeString];

      let routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=${gmapsMode}`;
      if (originQuery) {
        routeUrl += `&origin=${originQuery}`;
      }

      window.open(routeUrl, '_blank');
    });

    container.appendChild(btn);
  }
}

export async function initializeMap(containerId = 'map') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
    container.innerHTML = '<div style="padding: 20px; color: red;">Map configuration error: Missing API Key</div>';
    return;
  }

  try {
    await loadGoogleMapsAPI(apiKey);

    mapInstance = new google.maps.Map(container, {
      center: { lat: 0, lng: 0 },
      zoom: 2,
      mapTypeControl: false,
      streetViewControl: false
    });

    updateBadgeUI(container);
    createRoutingButton(container);

    // Listen to the requested CITY_UPDATED event
    eventBus.on('CITY_UPDATED', (city) => {
      if (!city || city.lat === undefined || city.lon === undefined) return;

      const coords = { lat: city.lat, lng: city.lon };

      // Update our internal routing state
      // If we already have a destination, it becomes the new origin for routing
      if (destCoords) {
         originCoords = { ...destCoords };
      }
      destCoords = { lat: city.lat, lon: city.lon };

      // Clear old marker
      if (currentMarker) {
        currentMarker.setMap(null);
      }

      // Add new marker
      currentMarker = new google.maps.Marker({
        position: coords,
        map: mapInstance,
        title: city.name
      });

      // Fly to the new location (micro view equivalent)
      mapInstance.panTo(coords);
      mapInstance.setZoom(13);
    });

  } catch (error) {
    console.error('Failed to load Google Maps', error);
  }

  return mapInstance;
}
