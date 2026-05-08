import L from 'leaflet';
import { eventBus } from '../core/eventBus.js';

export function initializeMap(containerId = 'map') {
  // Initialize the map centered globally (0,0) with a zoomed-out view
  const map = L.map(containerId).setView([0, 0], 2);

  // Add standard OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let currentMarker = null;

  // Scaffolding for modes
  const setMode = (mode, coords) => {
    if (mode === 'macro') {
      // Macro View: Overarching journey (zoomed out)
      map.flyTo(coords, 5, { duration: 1.5 });
    } else if (mode === 'micro') {
      // Micro View: Specific city excursions (zoomed in tightly)
      map.flyTo(coords, 13, { duration: 1.5 });
    }
  };

  // Listen to the requested CITY_UPDATED event
  eventBus.on('CITY_UPDATED', (city) => {
    if (!city || city.lat === undefined || city.lon === undefined) return;

    const coords = [city.lat, city.lon];

    // Clear old marker
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    // Add new marker
    currentMarker = L.marker(coords).addTo(map)
      .bindPopup(`<b>${city.name}</b>`)
      .openPopup();

    // Defaulting to micro view for city selection to show local context
    setMode('micro', coords);
  });

  return map;
}
