// services/geoService.js

// Haversine formula to calculate distance in km between two lat/lon points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

export async function searchCities(query, anchorCoords = null) {
  if (!query) return [];

  let fetchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&format=json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(fetchUrl, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.results || data.results.length === 0) return [];

    // Process and score results
    const processedResults = data.results.map(city => {
      let score = Math.log10(city.population || 1);

      let distance = null;
      if (anchorCoords) {
        distance = calculateDistance(anchorCoords.lat, anchorCoords.lon, city.latitude, city.longitude);
        if (distance < 300) {
          score += 5; // Significant boost for proximity < 300km
        }
      }

      if (city.feature_code === 'PPLC' || city.feature_code === 'PPLA') {
        score += 3; // Bonus for capital or major admin seat
      }

      return {
        ...city,
        calculatedDistance: distance,
        score: score
      };
    });

    // Sort descending by population as per "The Venice Fix" strict rules
    processedResults.sort((a, b) => (b.population || 0) - (a.population || 0));

    return processedResults;

  } catch (e) {
    console.warn('Geocoding search failed or timed out.', e);
    return []; // Fail silently and return empty array
  }
}
