import { createJourneyTimeline } from './ui/journeyTimeline.js';
import { eventBus } from './core/eventBus.js';
import { initializeMap, flyToCity } from './services/maps.js';

const app = document.querySelector('#app');

const timeline = createJourneyTimeline();
app.appendChild(timeline);

// Initialize the map after DOM is loaded
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'dummy_key';
initializeMap('map', apiKey);

// Listen to MAP_FLY_TO events triggered by clicking days
eventBus.on('MAP_FLY_TO', (location) => {
  if (location && location.lat !== undefined && location.lon !== undefined) {
    flyToCity(location.lat, location.lon);
  }
});
