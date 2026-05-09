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

  const performSearch = async (query) => {
    status.textContent = '📍';

    let result = null;
    let fetchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&format=json`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(fetchUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const name = data.results[0].name;
          const country = data.results[0].country || '';
          const fullName = country ? `${name}, ${country}` : name;

          result = {
            name: fullName,
            lat: parseFloat(data.results[0].latitude),
            lon: parseFloat(data.results[0].longitude)
          };
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed or timed out.', e);
    }

    if (result) {
      status.textContent = '✅';
      eventBus.emit('CITY_UPDATED', result);
    } else {
      status.textContent = '📍';
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
