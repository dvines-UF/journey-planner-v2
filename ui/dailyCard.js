import { eventBus } from '../core/eventBus.js';
import './dailyCard.css';

export function createDailyCard() {
  // Container wrapper to hold both backdrop and drawer
  const container = document.createElement('div');

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'daily-card-backdrop';
  container.appendChild(backdrop);

  // Drawer
  const drawer = document.createElement('div');
  drawer.className = 'daily-card-drawer';

  // Header
  const header = document.createElement('div');
  header.className = 'daily-card-header';

  const title = document.createElement('h2');
  title.textContent = 'City Details'; // Default title

  const closeBtn = document.createElement('button');
  closeBtn.className = 'daily-card-close-btn';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close daily card');

  header.appendChild(title);
  header.appendChild(closeBtn);
  drawer.appendChild(header);

  // Content area
  const content = document.createElement('div');
  content.className = 'daily-card-content';

  // Section: Culinary Connections
  const culinarySection = document.createElement('div');
  culinarySection.className = 'daily-card-section';
  const culinaryTitle = document.createElement('h3');
  culinaryTitle.textContent = 'Culinary Connections';
  const culinaryScaffold = document.createElement('div');
  culinaryScaffold.className = 'daily-card-scaffold';
  culinaryScaffold.textContent = 'Loading culinary data...';
  culinarySection.appendChild(culinaryTitle);
  culinarySection.appendChild(culinaryScaffold);
  content.appendChild(culinarySection);

  // Section: Local Excursions
  const excursionsSection = document.createElement('div');
  excursionsSection.className = 'daily-card-section';
  const excursionsTitle = document.createElement('h3');
  excursionsTitle.textContent = 'Local Excursions';
  const excursionsScaffold = document.createElement('div');
  excursionsScaffold.className = 'daily-card-scaffold';
  excursionsScaffold.textContent = 'Loading excursions...';
  excursionsSection.appendChild(excursionsTitle);
  excursionsSection.appendChild(excursionsScaffold);
  content.appendChild(excursionsSection);

  drawer.appendChild(content);
  container.appendChild(drawer);

  // Methods to open and close the drawer
  const openDrawer = () => {
    backdrop.classList.add('open');
    drawer.classList.add('open');
  };

  const closeDrawer = () => {
    backdrop.classList.remove('open');
    drawer.classList.remove('open');
  };

  // Event Listeners for UI
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Listen to the event bus
  eventBus.on('CITY_UPDATED', (city) => {
    // Safely update the title using textContent
    if (city && city.name) {
      title.textContent = city.name;
    }

    // Wait ~800ms before sliding in the drawer
    setTimeout(() => {
      openDrawer();
    }, 800);
  });

  return container;
}
