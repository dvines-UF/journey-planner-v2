import { eventBus } from '../core/eventBus.js';
import { state } from '../core/state.js';

export function createCityPicker() {
  const container = document.createElement('div');
  container.className = 'city-picker-container';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search city...';
  input.className = 'city-input';
  input.setAttribute('enterkeyhint', 'search');

  const status = document.createElement('span');
  status.className = 'city-status';

  // Strict stopPropagation to protect focus from bubbling up and hiding the iPhone keyboard
  const preventBubble = (e) => {
    e.stopPropagation();
  };

  input.addEventListener('touchstart', preventBubble, { passive: false });
  input.addEventListener('mousedown', preventBubble);
  input.addEventListener('click', preventBubble);
  input.addEventListener('focus', preventBubble);

  const fallbackHubs = {
    'london': { name: 'London', lat: 51.5074, lon: -0.1278 },
    'new york': { name: 'New York', lat: 40.7128, lon: -74.0060 },
    'tokyo': { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    'sydney': { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
  };

  const performSearch = async (query) => {
    status.textContent = '📍';

    let result = null;
    let fetchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const anchor = state.getAnchorCity();
    if (anchor && anchor.lat && anchor.lon) {
      // Proximity biasing using a viewbox around the anchor city.
      // Roughly +/- 5 degrees of latitude and longitude (approx 500km).
      const lat = parseFloat(anchor.lat);
      const lon = parseFloat(anchor.lon);
      fetchUrl += `&viewbox=${lon - 5},${lat + 5},${lon + 5},${lat - 5}&bounded=0`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          result = { name: data[0].display_name, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } else {
          // Fuzzy matching: if exact query fails, try to fetch matching results and pick the first one
          // that starts with the query, or just the first result if fuzzy search works.
          // Note: Nominatim already does some fuzzy matching, but we can retry without the viewbox just in case.
          if (anchor && anchor.lat && anchor.lon) {
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
            const fbController = new AbortController();
            const fbTimeoutId = setTimeout(() => fbController.abort(), 2500);
            const fbResponse = await fetch(fallbackUrl, { signal: fbController.signal });
            clearTimeout(fbTimeoutId);
            if (fbResponse.ok) {
              const fbData = await fbResponse.json();
              if (fbData && fbData.length > 0) {
                 result = { name: fbData[0].display_name, lat: parseFloat(fbData[0].lat), lon: parseFloat(fbData[0].lon) };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed or timed out, using fallback hubs.', e);
    }

    if (!result) {
      const normalizedQuery = query.toLowerCase().trim();
      if (fallbackHubs[normalizedQuery]) {
        result = fallbackHubs[normalizedQuery];
      }
    }

    if (result) {
      status.textContent = '✅';
      eventBus.emit('citySelected', result);
    } else {
      status.textContent = '❌';
      console.warn('Could not find city.');
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        performSearch(query);
      }
    }
  });

  container.appendChild(input);
  container.appendChild(status);

  return container;
}
