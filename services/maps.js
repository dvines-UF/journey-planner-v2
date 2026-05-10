let map;
let marker;
export function initializeMap(elementId, apiKey) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMapInstance`;
  script.async = true;
  document.head.appendChild(script);
  window.initMapInstance = () => {
    map = new google.maps.Map(document.getElementById(elementId), {
      center: { lat: 45.434, lng: 12.338 },
      zoom: 12,
      disableDefaultUI: true,
      styles: [{ featureType: "all", elementType: "labels", stylers: [{ visibility: "on" }] }]
    });
  };
}
export function flyToCity(lat, lon) {
  if (!map) return;
  const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
  map.setCenter(pos);
  map.setZoom(13);
  if (marker) marker.setMap(null);
  marker = new google.maps.Marker({ position: pos, map: map, animation: google.maps.Animation.DROP });
}
