import { eventBus } from './eventBus.js';

class State {
  constructor() {
    this.journey = this.loadJourney() || [];
    this.activeDayId = null;

    eventBus.on('CITY_UPDATED', (cityPayload) => {
      if (this.activeDayId) {
        this.updateDayLocation(this.activeDayId, cityPayload);
      } else {
        if (this.journey.length === 0) {
          const newDay = this.addDay();
          this.setActiveDay(newDay.id);
          this.updateDayLocation(newDay.id, cityPayload);
        }
      }
    });
  }

  loadJourney() {
    try {
      const data = localStorage.getItem('journey');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load journey from localStorage', e);
    }
    return null;
  }

  saveJourney() {
    try {
      localStorage.setItem('journey', JSON.stringify(this.journey));
    } catch (e) {
      console.warn('Failed to save journey to localStorage', e);
    }
  }

  addDay() {
    const newDay = {
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dayNumber: this.journey.length + 1,
      location: null,
      transport_mode: null
    };
    this.journey.push(newDay);
    this.saveJourney();
    eventBus.emit('JOURNEY_UPDATED', this.journey);
    return newDay;
  }

  updateDayLocation(dayId, locationData) {
    const day = this.journey.find(d => d.id === dayId);
    if (day) {
      day.location = locationData;
      this.saveJourney();
      eventBus.emit('JOURNEY_UPDATED', this.journey);
    }
  }

  setActiveDay(dayId) {
    this.activeDayId = dayId;
    eventBus.emit('ACTIVE_DAY_CHANGED', dayId);
  }

  getJourney() {
    return this.journey;
  }

  getActiveDayId() {
    return this.activeDayId;
  }
}

export const state = new State();
