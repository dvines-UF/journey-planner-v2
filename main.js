import { greeting } from './ui/greeting.js';
import { createCityPicker } from './ui/cityPicker.js';
import { createDailyCard } from './ui/dailyCard.js';
import { eventBus } from './core/eventBus.js';
import { state } from './core/state.js';
import { initializeMap } from './services/maps.js';

const app = document.querySelector('#app');
app.innerHTML = greeting();

const cityPicker = createCityPicker();
app.appendChild(cityPicker);

const dailyCard = createDailyCard();
app.appendChild(dailyCard);

eventBus.on('CITY_UPDATED', (city) => {
  console.log('City updated via eventBus:', city);
  state.setAnchorCity(city);

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
