import { greeting } from './ui/greeting.js';
import { createCityPicker } from './ui/cityPicker.js';
import { createJourneyTimeline } from './ui/journeyTimeline.js';
import { eventBus } from './core/eventBus.js';
import { initializeMap, flyToCity } from './services/maps.js';

const app = document.querySelector('#app');
app.innerHTML = greeting();

const cityPicker = createCityPicker();
app.appendChild(cityPicker);

const timeline = createJourneyTimeline();
app.appendChild(timeline);

eventBus.on('CITY_UPDATED', (city) => {
  console.log('City updated via eventBus:', city);

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
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'dummy_key';
initializeMap('map', apiKey);

// Listen to MAP_FLY_TO events triggered by clicking days
eventBus.on('MAP_FLY_TO', (location) => {
  if (location && location.lat !== undefined && location.lon !== undefined) {
    flyToCity(location.lat, location.lon);
  }
});
