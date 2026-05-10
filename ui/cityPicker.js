import { eventBus } from '../core/eventBus.js';
import './cityPicker.css';

export function createCityPicker() {
  const container = document.createElement('div');
  container.className = 'city-picker-container';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'city-input-wrapper';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search city...';
  input.className = 'city-input';
  input.setAttribute('enterkeyhint', 'search');

  const status = document.createElement('span');
  status.className = 'city-status';

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(status);

  const resultsList = document.createElement('ul');
  resultsList.className = 'city-picker-results';

  // Strict stopPropagation to protect focus from bubbling up and hiding the iPhone keyboard
  const preventBubble = (e) => {
    e.stopPropagation();
  };

  input.addEventListener('touchstart', preventBubble, { passive: false });
  input.addEventListener('mousedown', preventBubble);
  input.addEventListener('click', preventBubble);
  input.addEventListener('focus', preventBubble);
  resultsList.addEventListener('touchstart', preventBubble, { passive: false });
  resultsList.addEventListener('mousedown', preventBubble);
  resultsList.addEventListener('click', preventBubble);

  const fallbackHubs = [
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, population: 8982000 },
    { name: 'New York', country: 'United States', admin1: 'New York', lat: 40.7128, lon: -74.0060, population: 8399000 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, population: 13929286 },
    { name: 'Sydney', country: 'Australia', admin1: 'New South Wales', lat: -33.8688, lon: 151.2093, population: 5312000 }
  ];

  const renderResults = (results) => {
    resultsList.innerHTML = '';

    if (results.length === 0) {
      status.textContent = '';
      return;
    }

    results.forEach(city => {
      const li = document.createElement('li');
      li.className = 'city-result-item';

      const content = document.createElement('div');
      content.className = 'city-result-content';

      const textWrapper = document.createElement('div');
      textWrapper.className = 'city-text-wrapper';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'city-name';
      nameSpan.textContent = city.name;

      const adminSpan = document.createElement('span');
      adminSpan.className = 'city-admin';
      const adminParts = [city.admin1, city.country].filter(Boolean).join(', ');
      if (adminParts) {
         adminSpan.textContent = `, ${adminParts}`;
      }

      textWrapper.appendChild(nameSpan);
      textWrapper.appendChild(adminSpan);
      content.appendChild(textWrapper);

      const iconSpan = document.createElement('span');
      iconSpan.className = 'city-icon';
      iconSpan.textContent = (city.population && city.population > 500000) ? '✈️' : '🚆';
      content.appendChild(iconSpan);

      li.appendChild(content);

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = city.name;
        resultsList.innerHTML = '';
        status.textContent = '✅';
        const resultPayload = {
          name: city.country ? `${city.name}, ${city.country}` : city.name,
          lat: city.lat || city.latitude,
          lon: city.lon || city.longitude
        };
        eventBus.emit('CITY_UPDATED', resultPayload);
        if (document.activeElement) document.activeElement.blur();
      });

      resultsList.appendChild(li);
    });
  };

  const performSearch = async (query) => {
    status.textContent = '📍';
    resultsList.innerHTML = '';

    let fetchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&format=json`;
    let results = [];

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
          // Sort by population descending
          results = data.results.sort((a, b) => (b.population || 0) - (a.population || 0));
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed or timed out, using fallback hubs.', e);
    }

    if (results.length === 0) {
      const normalizedQuery = query.toLowerCase().trim();
      results = fallbackHubs.filter(hub => hub.name.toLowerCase().includes(normalizedQuery));
    }

    if (results.length > 0) {
      status.textContent = '';
      renderResults(results);
    } else {
      status.textContent = '';
      console.warn('Could not find city.');
    }
  };

  let debounceTimeout = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const query = input.value.trim();
    if (!query) {
       resultsList.innerHTML = '';
       status.textContent = '';
       return;
    }

    debounceTimeout = setTimeout(() => {
      performSearch(query);
    }, 400);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimeout);
      const query = input.value.trim();
      if (query) {
        performSearch(query);
      }
    }
  });

  container.appendChild(inputWrapper);
  container.appendChild(resultsList);

  return container;
}
