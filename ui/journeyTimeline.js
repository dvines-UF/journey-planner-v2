import { eventBus } from '../core/eventBus.js';
import { state } from '../core/state.js';
import './journeyTimeline.css';

export function createJourneyTimeline() {
  const container = document.createElement('div');
  container.className = 'journey-timeline-container';

  const scrollArea = document.createElement('div');
  scrollArea.className = 'journey-timeline-scroll';

  // VALIDATION: We will re-render exactly what is needed without duplicating listeners.
  // Using an inner helper for creating elements rather than tearing down DOM.
  // Wait, tearing down innerHTML = '' is safe from listener duplication if listeners are attached to the elements we discard.
  const renderTimeline = () => {
    scrollArea.innerHTML = '';
    const journey = state.getJourney();
    const activeDayId = state.getActiveDayId();

    journey.forEach(day => {
      const card = document.createElement('div');
      card.className = 'day-card';
      if (day.id === activeDayId) {
        card.classList.add('active');
      }

      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = `Day ${day.dayNumber}`;

      const cityName = document.createElement('div');
      cityName.className = 'city-name';
      cityName.textContent = day.location ? day.location.name : 'Choose City';

      card.appendChild(dayNumber);
      card.appendChild(cityName);

      card.addEventListener('click', () => {
        state.setActiveDay(day.id);
        if (day.location) {
          eventBus.emit('MAP_FLY_TO', day.location);
        }
      });

      scrollArea.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-day-btn';
    addBtn.textContent = '+ Add Next Day';
    addBtn.addEventListener('click', () => {
      const newDay = state.addDay();
      state.setActiveDay(newDay.id);
      setTimeout(() => {
        scrollArea.scrollLeft = scrollArea.scrollWidth;
      }, 50);
    });

    scrollArea.appendChild(addBtn);
  };

  // We are subscribing to eventBus here.
  // It's important we don't call createJourneyTimeline multiple times, but if we do,
  // we would have multiple listeners. In main.js, we only call it once.
  eventBus.on('JOURNEY_UPDATED', renderTimeline);
  eventBus.on('ACTIVE_DAY_CHANGED', renderTimeline);

  // Initial render
  renderTimeline();

  const initialJourney = state.getJourney();
  if (initialJourney.length > 0 && !state.getActiveDayId()) {
     state.setActiveDay(initialJourney[0].id);
  }

  container.appendChild(scrollArea);
  return container;
}
