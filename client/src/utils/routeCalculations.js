import dayjs from 'dayjs';

/**
 * Calculate arrival times and distances for each stop in an optimized route
 * @param {Object} optimizedRoute - The optimized route object from the API
 * @returns {Array} Array of stops with calculated arrival times and distances
 */
export const calculateRouteWithTimes = (optimizedRoute) => {
  if (!optimizedRoute || !optimizedRoute.route) return null;

  const WALKING_SPEED_MPH = 3.0;
  const stops = optimizedRoute.route;
  const stopsWithTimes = [];

  // Find earliest appointment start time from all stops
  let earliestTime = null;
  stops.forEach(stop => {
    if (stop.start_time) {
      const stopTime = dayjs(stop.start_time, "HH:mm");
      if (!earliestTime || stopTime.isBefore(earliestTime)) {
        earliestTime = stopTime;
      }
    }
  });

  // Start time - use earliest appointment time or current time
  let currentTime = earliestTime || dayjs();

  // Track pickup times for each appointment
  const pickupTimes = {}; // { appointment_id: pickup_time }

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const prevStop = i > 0 ? stops[i - 1] : null;

    // Calculate distance from previous stop
    let distanceFromPrevious = 0;
    if (prevStop) {
      const lat1 = parseFloat(prevStop.coordinates.lat);
      const lng1 = parseFloat(prevStop.coordinates.lng);
      const lat2 = parseFloat(stop.coordinates.lat);
      const lng2 = parseFloat(stop.coordinates.lng);

      // Haversine formula for distance
      const R = 3959; // Earth radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceFromPrevious = R * c;
    }

    // Calculate travel time to this stop (in minutes)
    const travelTime = (distanceFromPrevious / WALKING_SPEED_MPH) * 60;

    // Add travel time to current time
    if (prevStop) {
      currentTime = currentTime.add(travelTime, 'minute');
    }

    // For pickups and solo walks, respect pickup window (start_time to end_time)
    if ((stop.stop_type === 'pickup' || stop.stop_type === 'solo') && stop.start_time) {
      const pickupWindowStart = dayjs(stop.start_time, "HH:mm");

      if (currentTime.isBefore(pickupWindowStart)) {
        // We arrived before the pickup window opens - wait until window opens
        currentTime = pickupWindowStart;
      }
    }

    // Track when each dog is picked up (for rolling pickup timing)
    if (stop.stop_type === 'pickup') {
      // Record this dog's pickup time (after the 5 min pickup duration)
      pickupTimes[stop.appointment_id] = currentTime.add(5, 'minute');
    }

    // Handle dropoff timing - each dog's walk completes based on THEIR pickup time
    if (stop.stop_type === 'dropoff') {
      // Find when THIS specific dog was picked up
      const thisDogsPickupTime = pickupTimes[stop.appointment_id];

      if (thisDogsPickupTime) {
        // Calculate when this dog's walk completes (from THEIR pickup time)
        const walkDuration = stop.duration || 30;
        const targetDropoffTime = thisDogsPickupTime.add(walkDuration, 'minute');

        // If we arrive before the dog's walk is done, wait
        if (currentTime.isBefore(targetDropoffTime)) {
          currentTime = targetDropoffTime;
        }
      }
    }

    stopsWithTimes.push({
      ...stop,
      arrivalTime: currentTime.format('h:mm A'),
      distanceFromPrevious: distanceFromPrevious.toFixed(2),
      travelTimeFromPrevious: Math.round(travelTime),
      stopNumber: i + 1
    });

    // Add stop duration
    if (stop.stop_type === 'pickup') {
      // 5 min per pickup
      currentTime = currentTime.add(5, 'minute');
    } else if (stop.stop_type === 'solo') {
      // For solo walks, add full duration
      const walkDuration = stop.duration || 30;
      currentTime = currentTime.add(walkDuration, 'minute');
    } else if (stop.stop_type === 'dropoff') {
      // 2 min per dropoff
      currentTime = currentTime.add(2, 'minute');
    }
  }

  return stopsWithTimes;
};
