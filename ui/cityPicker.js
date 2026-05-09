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

  // Create Full-screen Overlay
  const overlay = document.createElement('div');
  overlay.className = 'city-picker-overlay';

  const header = document.createElement('div');
  header.className = 'city-picker-header';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'city-picker-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close search');

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
    resultsList.innerHTML = ''; // reset results
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 300); // Wait for transition
  };

  const closeOverlay = () => {
    overlay.classList.remove('open');
    if (document.activeElement) {
      document.activeElement.blur(); // Dismiss software keyboard
    }
  };

  launchBtn.addEventListener('click', openOverlay);
  closeBtn.addEventListener('click', closeOverlay);

  // Prevent keyboard dismiss issues on mobile
  const preventBubble = (e) => {
    e.stopPropagation();
  };
  input.addEventListener('touchstart', preventBubble, { passive: false });
  input.addEventListener('mousedown', preventBubble);
  input.addEventListener('click', preventBubble);

  // Debounce and Search Logic
  let debounceTimeout = null;

  const renderResults = (results, anchorCoords) => {
    resultsList.innerHTML = ''; // Clear previous

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

      const infoDiv = document.createElement('div');
      infoDiv.className = 'city-result-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'city-result-name';
      nameSpan.textContent = city.name;

      const adminSpan = document.createElement('span');
      adminSpan.className = 'city-result-admin';
      const adminParts = [city.admin1, city.country].filter(Boolean).join(', ');
      adminSpan.textContent = adminParts;

      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(adminSpan);
      li.appendChild(infoDiv);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'city-result-meta';

      let distanceText = '';
      let iconText = '';

      if (city.calculatedDistance !== null && city.calculatedDistance !== undefined) {
        distanceText = `${Math.round(city.calculatedDistance).toLocaleString()}km away`;
        if (city.calculatedDistance > 500 || (city.population && city.population > 1000000)) {
          iconText = '✈️';
        } else {
          iconText = '🚆';
        }
      } else if (city.population && city.population > 1000000) {
        iconText = '✈️';
      }

      if (distanceText) {
        const distSpan = document.createElement('span');
        distSpan.textContent = distanceText;
        metaDiv.appendChild(distSpan);
      }

      if (iconText) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'city-result-icon';
        iconSpan.textContent = iconText;
        metaDiv.appendChild(iconSpan);
      }

      li.appendChild(metaDiv);

      li.addEventListener('click', () => {
        const selectedCity = {
          name: city.country ? `${city.name}, ${city.country}` : city.name,
          lat: city.latitude,
          lon: city.longitude,
          fullData: city // Pass full object if needed
        };

        // Save as last_home_base if it's Day 1 (no anchor in state implies Day 1 in this isolated test context, though we will explicitly save it)
        try {
            localStorage.setItem('last_home_base', JSON.stringify({ lat: city.latitude, lon: city.longitude }));
        } catch(e) { console.warn("Failed to save to localStorage", e); }

        eventBus.emit('CITY_SELECTED', selectedCity);
        eventBus.emit('CITY_UPDATED', selectedCity); // Maintain backwards compatibility for main.js and maps

        closeOverlay();
      });

      resultsList.appendChild(li);
    });
  };

  const handleInput = () => {
    clearTimeout(debounceTimeout);
    const query = input.value.trim();

    if (!query) {
      resultsList.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      // Determine anchor coords
      let anchorCoords = null;
      const currentAnchorCity = state.getAnchorCity();

      if (currentAnchorCity) {
          // Day N > 1
          anchorCoords = { lat: currentAnchorCity.lat, lon: currentAnchorCity.lon };
      } else {
          // Day 1: Try to load from localStorage
          try {
              const savedBase = localStorage.getItem('last_home_base');
              if (savedBase) {
                  anchorCoords = JSON.parse(savedBase);
              }
          } catch(e) { console.warn("Failed to read localStorage", e); }
      }

      const results = await searchCities(query, anchorCoords);
      renderResults(results, anchorCoords);
    }, 400);
  };

  input.addEventListener('input', handleInput);

  return container;
}
