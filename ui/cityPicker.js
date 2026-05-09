import { eventBus } from '../core/eventBus.js';
import { searchCities } from '../services/geoService.js';
import { state } from '../core/state.js';
import './cityPicker.css';

export function createCityPicker() {
  const container = document.createElement('div');
  container.className = 'city-picker-launcher';

  const launchBtn = document.createElement('button');
  launchBtn.className = 'city-picker-launcher-btn';
  launchBtn.textContent = 'Search Destinations...';
  container.appendChild(launchBtn);

  const overlay = document.createElement('div');
  overlay.className = 'city-picker-overlay';

  const header = document.createElement('div');
  header.className = 'city-picker-header';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'city-picker-close-btn';
  closeBtn.textContent = '✕';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'city-input-wrapper';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search city...';
  input.className = 'city-input';
  input.setAttribute('enterkeyhint', 'search');

  inputWrapper.appendChild(input);
  header.appendChild(closeBtn);
  header.appendChild(inputWrapper);
  overlay.appendChild(header);

  const resultsList = document.createElement('ul');
  resultsList.className = 'city-picker-results';
  overlay.appendChild(resultsList);

  document.body.appendChild(overlay);

  // Overlay Mechanics
  const openOverlay = () => {
    input.value = '';
    resultsList.innerHTML = '';
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 300);
  };

  const closeOverlay = () => {
    overlay.classList.remove('open');
    if (document.activeElement) document.activeElement.blur();
  };

  launchBtn.addEventListener('click', openOverlay);
  closeBtn.addEventListener('click', closeOverlay);

  // MOBILE PROTECTION: Prevent keyboard dismiss
  const preventBubble = (e) => e.stopPropagation();
  input.addEventListener('touchstart', preventBubble, { passive: false });
  input.addEventListener('mousedown', preventBubble);
  input.addEventListener('click', preventBubble);

  const renderResults = (results) => {
    resultsList.innerHTML = '';

    if (results.length === 0) {
      const emptyState = document.createElement('li');
      emptyState.className = 'city-picker-empty';
      emptyState.textContent = 'No results found';
      resultsList.appendChild(emptyState);
      return;
    }

    results.forEach(city => {
      const li = document.createElement('li');
      li.className = 'city-result-item';

      // SPACE EFFICIENT UI: Single line layout
      const content = document.createElement('div');
      content.className = 'city-result-content';
      content.style.display = 'flex';
      content.style.justifyContent = 'space-between';
      content.style.alignItems = 'center';
      content.style.width = '100%';

      const textWrapper = document.createElement('div');
      textWrapper.style.overflow = 'hidden';
      textWrapper.style.textOverflow = 'ellipsis';
      textWrapper.style.whiteSpace = 'nowrap';
      textWrapper.style.flexGrow = '1';
      textWrapper.style.marginRight = '8px';

      const nameSpan = document.createElement('span');
      nameSpan.style.fontWeight = 'bold';
      nameSpan.style.color = '#2d3748';
      nameSpan.textContent = city.name;

      const adminSpan = document.createElement('span');
      adminSpan.style.fontSize = '0.85em';
      adminSpan.style.color = '#718096';

      const adminParts = [city.admin1, city.country].filter(Boolean).join(', ');
      // The instructions specified "City, Region" so we prepend the comma if admin parts exist.
      if (adminParts) {
         adminSpan.textContent = `, ${adminParts}`;
      }

      textWrapper.appendChild(nameSpan);
      textWrapper.appendChild(adminSpan);
      content.appendChild(textWrapper);

      // Icon Logic (✈️ for big hubs, 🚆 for regional)
      const iconSpan = document.createElement('span');
      iconSpan.style.flexShrink = '0';
      iconSpan.textContent = (city.population > 500000) ? '✈️' : '🚆';
      content.appendChild(iconSpan);

      li.appendChild(content);

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedCity = {
          name: city.country ? `${city.name}, ${city.country}` : city.name,
          lat: city.latitude,
          lon: city.longitude,
          fullData: city
        };
        eventBus.emit('CITY_UPDATED', selectedCity);
        closeOverlay();
      });

      resultsList.appendChild(li);
    });
  };

  let debounceTimeout = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const query = input.value.trim();
    if (!query) { resultsList.innerHTML = ''; return; }

    debounceTimeout = setTimeout(async () => {
      const results = await searchCities(query);
      renderResults(results);
    }, 400);
  });

  // Retain 'Enter to Search' functionality fallback
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimeout);
      const query = input.value.trim();
      if (query) {
        searchCities(query).then(renderResults);
      }
    }
  });

  return container;
}
