import { eventBus } from '../core/eventBus.js';

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
    const apiKey = import.meta.env.VITE_GEOCODE_API_KEY;

    let result = null;

    try {
      const controller = new AbortController();
      // Short timeout to fallback quickly on offline or slow connections
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          result = { name: data[0].name, lat: data[0].lat, lon: data[0].lon };
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed or timed out, using fallback hubs.', e);
    }

    if (!result) {
      const normalizedQuery = query.toLowerCase().trim();
      if (fallbackHubs[normalizedQuery]) {
        result = fallbackHubs[normalizedQuery];
      } else {
        result = { name: query, lat: 0, lon: 0, isFallback: true };
      }
    }

    status.textContent = '✅';
    eventBus.emit('citySelected', result);
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
