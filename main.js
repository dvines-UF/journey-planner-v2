import { greeting } from './ui/greeting.js';
import { createCityPicker } from './ui/cityPicker.js';
import { eventBus } from './core/eventBus.js';

const app = document.querySelector('#app');
app.innerHTML = greeting();

const cityPicker = createCityPicker();
app.appendChild(cityPicker);

eventBus.on('citySelected', (city) => {
  console.log('City selected via eventBus:', city);
  // Optional: add a simple UI feedback directly in main.js to verify it's working visually
  let display = document.getElementById('city-display');
  if (!display) {
    display = document.createElement('div');
    display.id = 'city-display';
    app.appendChild(display);
  }
  display.textContent = `Selected: ${city.name} (Lat: ${city.lat}, Lon: ${city.lon})`;
});
