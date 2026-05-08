import { greeting } from './ui/greeting.js';
import { createCityPicker } from './ui/cityPicker.js';
import { eventBus } from './core/eventBus.js';
import { state } from './core/state.js';
import { initializeMap } from './services/maps.js';

const app = document.querySelector('#app');
app.innerHTML = greeting();

const cityPicker = createCityPicker();
app.appendChild(cityPicker);

eventBus.on('citySelected', (city) => {
  console.log('City selected via eventBus:', city);
  state.setAnchorCity(city);

  // Broadcast CITY_UPDATED to listeners like the maps engine
  eventBus.emit('CITY_UPDATED', city);

  // Optional: add a simple UI feedback directly in main.js to verify it's working visually
  let display = document.getElementById('city-display');
  if (!display) {
    display = document.createElement('div');
    display.id = 'city-display';
    app.appendChild(display);
  }
  display.textContent = `Selected: ${city.name} (Lat: ${city.lat}, Lon: ${city.lon})`;
});

// Initialize the map after DOM is loaded
initializeMap('map');
