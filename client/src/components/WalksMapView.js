import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { X, MapPin, Clock, DollarSign, Moon, Sun, Mountain, Route, Navigation, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different walk types
const createCustomIcon = (color, completed = false, count = null) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      opacity: ${completed ? 0.6 : 1};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      ${completed ? '<div style="color: white; font-size: 18px;">✓</div>' : ''}
      ${count && count > 1 ? `
        <div style="
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">${count}</div>
      ` : ''}
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Numbered route marker icon for journey view
const createNumberedRouteIcon = (number, stopType) => {
  // Color based on stop type
  let bgColor, icon;

  if (stopType === 'pickup') {
    bgColor = '#3b82f6'; // Blue for pickup
    icon = '📥';
  } else if (stopType === 'dropoff') {
    bgColor = '#22c55e'; // Green for dropoff
    icon = '📤';
  } else {
    bgColor = '#9333ea'; // Purple for solo
    icon = '🐕';
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${bgColor};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 12px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      <div style="color: white; font-size: 16px; font-weight: 700; line-height: 1;">${number}</div>
      <div style="font-size: 10px; line-height: 1; margin-top: 2px;">${icon}</div>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Map component that auto-fits to markers
const AutoFitBounds = ({ walks }) => {
  const map = useMap();

  useEffect(() => {
    if (!walks || walks.length === 0) return;

    const geocodedWalks = walks.filter(w => w.pet?.latitude && w.pet?.longitude);
    if (geocodedWalks.length === 0) return;

    const bounds = geocodedWalks.map(w => [w.pet.latitude, w.pet.longitude]);

    if (bounds.length === 1) {
      // Single marker - center on it
      map.setView(bounds[0], 14);
    } else {
      // Multiple markers - fit to bounds
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }
  }, [walks, map]);

  return null;
};

export default function WalksMapView({ walks, isCompleted, onClose }) {
  const mapRef = useRef();
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'light', 'natural'
  const [showRoute, setShowRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Filter and categorize walks
  const { geocodedWalks, nonGeocodedWalks, nonGeocodedCount } = useMemo(() => {
    const geocoded = walks.filter(w => w.pet?.latitude && w.pet?.longitude);
    const nonGeocoded = walks.filter(w => !w.pet?.latitude || !w.pet?.longitude);
    return {
      geocodedWalks: geocoded,
      nonGeocodedWalks: nonGeocoded,
      nonGeocodedCount: nonGeocoded.length
    };
  }, [walks]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (geocodedWalks.length === 0) {
      return [40.7128, -74.0060]; // NYC default
    }

    // Validate all coordinates are valid numbers
    const validWalks = geocodedWalks.filter(w =>
      w.pet?.latitude &&
      w.pet?.longitude &&
      !isNaN(w.pet.latitude) &&
      !isNaN(w.pet.longitude)
    );

    if (validWalks.length === 0) {
      return [40.7128, -74.0060]; // NYC default
    }

    const avgLat = validWalks.reduce((sum, w) => sum + w.pet.latitude, 0) / validWalks.length;
    const avgLng = validWalks.reduce((sum, w) => sum + w.pet.longitude, 0) / validWalks.length;

    // Final safety check
    if (isNaN(avgLat) || isNaN(avgLng)) {
      return [40.7128, -74.0060]; // NYC default
    }

    return [avgLat, avgLng];
  }, [geocodedWalks]);

  // Get icon for walk based on type and completion status
  const getIconForWalk = (walk, count = null) => {
    const completed = isCompleted(walk);

    if (completed) {
      return createCustomIcon('#22c55e', true, count); // Green for completed
    }

    // Check if walk is part of an active group
    if (walk.walk_group_id) {
      return createCustomIcon('#f97316', false, count); // Orange for grouped walks
    }

    const walkType = walk.walk_type || (walk.solo ? 'solo' : 'group');
    if (walkType === 'solo') {
      return createCustomIcon('#9333EA', false, count); // Purple for solo
    } else if (walkType === 'training') {
      return createCustomIcon('#f59e0b', false, count); // Amber for training
    }
    return createCustomIcon('#3B82F6', false, count); // Blue for group
  };

  // Group walks by coordinates to handle multiple appointments at same location
  const groupedWalksByLocation = useMemo(() => {
    const locationGroups = {};

    geocodedWalks.forEach(walk => {
      // Create a key based on coordinates (rounded to 6 decimal places to handle slight differences)
      // Convert to number first in case they're stored as strings
      const lat = parseFloat(walk.pet.latitude).toFixed(6);
      const lng = parseFloat(walk.pet.longitude).toFixed(6);
      const key = `${lat},${lng}`;

      if (!locationGroups[key]) {
        locationGroups[key] = {
          walks: [],
          latitude: parseFloat(walk.pet.latitude),
          longitude: parseFloat(walk.pet.longitude)
        };
      }
      locationGroups[key].walks.push(walk);
    });

    return Object.values(locationGroups);
  }, [geocodedWalks]);

  // Group walks by walk_group_id for visual connections
  const walkGroups = useMemo(() => {
    const groups = {};
    geocodedWalks.forEach(walk => {
      if (walk.walk_group_id && !isCompleted(walk)) {
        if (!groups[walk.walk_group_id]) {
          groups[walk.walk_group_id] = [];
        }
        groups[walk.walk_group_id].push(walk);
      }
    });
    return Object.values(groups).filter(group => group.length > 1);
  }, [geocodedWalks, isCompleted]);

  // Fetch optimized route from backend
  const fetchOptimizedRoute = async () => {
    setIsLoadingRoute(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/routes/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: dayjs().format('YYYY-MM-DD'),
          compare: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizedRoute(data);
      } else {
        console.error('Failed to fetch optimized route');
        setOptimizedRoute(null);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setOptimizedRoute(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Toggle route optimization
  const handleToggleRoute = () => {
    console.log('handleToggleRoute called, showRoute =', showRoute);
    if (!showRoute) {
      console.log('Fetching optimized route...');
      fetchOptimizedRoute();
      setShowTimeline(true); // Auto-show timeline when enabling route
    } else {
      console.log('Hiding route and timeline');
      setShowTimeline(false);
    }
    setShowRoute(!showRoute);
  };

  // Calculate arrival times for each stop
  const routeWithTimes = useMemo(() => {
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

    // Track groups to add walk duration after pickups
    const groupPickupComplete = {}; // { walk_group_id: boolean }
    const groupPickupAppointmentIds = {}; // Track which appointments were picked up in each group

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
      // Can only pick up AFTER start_time (earliest pickup) and BEFORE end_time (latest pickup)
      if ((stop.stop_type === 'pickup' || stop.stop_type === 'solo') && stop.start_time) {
        const pickupWindowStart = dayjs(stop.start_time, "HH:mm");

        if (currentTime.isBefore(pickupWindowStart)) {
          // We arrived before the pickup window opens - wait until window opens
          currentTime = pickupWindowStart;
        }

        // Note: Optimizer should ensure we don't arrive after end_time,
        // but that would require knowing end_time here
      }

      // Check if we're transitioning from pickup to dropoff for a group
      if (stop.stop_type === 'dropoff' && stop.walk_group_id) {
        // If this is the first dropoff for this group, add walk duration
        if (!groupPickupComplete[stop.walk_group_id]) {
          groupPickupComplete[stop.walk_group_id] = true;
          const walkDuration = stop.duration || 30;
          currentTime = currentTime.add(walkDuration, 'minute');
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
        // Track that this appointment was picked up for its group
        if (stop.walk_group_id) {
          if (!groupPickupAppointmentIds[stop.walk_group_id]) {
            groupPickupAppointmentIds[stop.walk_group_id] = [];
          }
          groupPickupAppointmentIds[stop.walk_group_id].push(stop.appointment_id);
        }
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
  }, [optimizedRoute]);

  // Don't render anything if walks is null/undefined
  if (!walks || walks.length === 0) {
    return (
      <MapViewContainer $mapStyle={mapStyle}>
        <MapHeader>
          <MapTitle>
            <MapPin size={20} />
            Today's Walks
          </MapTitle>
          <HeaderButtons>
            <MapStyleButton
              $active={mapStyle === 'dark'}
              onClick={() => setMapStyle('dark')}
              title="Dark mode"
            >
              <Moon size={18} />
            </MapStyleButton>
            <MapStyleButton
              $active={mapStyle === 'light'}
              onClick={() => setMapStyle('light')}
              title="Light mode"
            >
              <Sun size={18} />
            </MapStyleButton>
            <MapStyleButton
              $active={mapStyle === 'natural'}
              onClick={() => setMapStyle('natural')}
              title="Natural/Terrain mode"
            >
              <Mountain size={18} />
            </MapStyleButton>
            <CloseButton onClick={onClose} title="Close map">
              <X size={24} />
            </CloseButton>
          </HeaderButtons>
        </MapHeader>
        <EmptyMapState $mapStyle={mapStyle}>
          <EmptyMapIcon $mapStyle={mapStyle}>
            <MapPin size={48} />
          </EmptyMapIcon>
          <EmptyMapText $mapStyle={mapStyle}>No walks scheduled today</EmptyMapText>
          <EmptyMapSubtext $mapStyle={mapStyle}>Schedule some walks to see them on the map</EmptyMapSubtext>
        </EmptyMapState>
      </MapViewContainer>
    );
  }

  return (
    <MapViewContainer $mapStyle={mapStyle}>
      <MapHeader>
        <MapTitle>
          <MapPin size={20} />
          Today's Walks
        </MapTitle>
        <HeaderButtons>
          {geocodedWalks.length > 1 && (
            <RouteToggleButton
              $active={showRoute}
              onClick={handleToggleRoute}
              disabled={isLoadingRoute}
              title={showRoute ? "Hide optimized route" : "Show optimized route"}
            >
              <Route size={18} />
            </RouteToggleButton>
          )}
          <MapStyleButton
            $active={mapStyle === 'dark'}
            onClick={() => setMapStyle('dark')}
            title="Dark mode"
          >
            <Moon size={18} />
          </MapStyleButton>
          <MapStyleButton
            $active={mapStyle === 'light'}
            onClick={() => setMapStyle('light')}
            title="Light mode"
          >
            <Sun size={18} />
          </MapStyleButton>
          <MapStyleButton
            $active={mapStyle === 'natural'}
            onClick={() => setMapStyle('natural')}
            title="Natural/Terrain mode"
          >
            <Mountain size={18} />
          </MapStyleButton>
          <CloseButton onClick={onClose} title="Close map">
            <X size={24} />
          </CloseButton>
        </HeaderButtons>
      </MapHeader>

      {nonGeocodedCount > 0 && (
        <MapWarning>
          ⚠️ {nonGeocodedCount} walk{nonGeocodedCount !== 1 ? 's' : ''} without location data
          {nonGeocodedWalks.length > 0 && (
            <span> ({nonGeocodedWalks.map(w => w.pet?.name).filter(Boolean).join(', ')})</span>
          )}
        </MapWarning>
      )}

      {geocodedWalks.length === 0 ? (
        <EmptyMapState $mapStyle={mapStyle}>
          <EmptyMapIcon $mapStyle={mapStyle}>
            <MapPin size={48} />
          </EmptyMapIcon>
          <EmptyMapText $mapStyle={mapStyle}>No walks with location data yet</EmptyMapText>
          <EmptyMapSubtext $mapStyle={mapStyle}>Add addresses to your pets to see them on the map</EmptyMapSubtext>
        </EmptyMapState>
      ) : (
        <>
          <StyledMapContainer
            center={mapCenter}
            zoom={13}
            ref={mapRef}
            zoomControl={true}
            attributionControl={false}
            $mapStyle={mapStyle}
          >
            <TileLayer
              url={
                mapStyle === 'dark'
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : mapStyle === 'light'
                  ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              }
              attribution={
                mapStyle === 'natural'
                  ? '&copy; <a href="https://www.esri.com/">Esri</a>'
                  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              }
              maxZoom={20}
            />

            <AutoFitBounds walks={geocodedWalks} />

            {/* Draw lines between grouped walks */}
            {walkGroups.map((group, idx) => {
              const positions = group.map(walk => [walk.pet.latitude, walk.pet.longitude]);
              return (
                <Polyline
                  key={`group-${idx}`}
                  positions={positions}
                  pathOptions={{
                    color: '#f97316',
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '10, 10'
                  }}
                />
              );
            })}

            {/* Draw optimized route polyline */}
            {showRoute && optimizedRoute && optimizedRoute.path_coordinates && (
              <Polyline
                positions={optimizedRoute.path_coordinates.map(coord => [coord.lat, coord.lng])}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '5, 10',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}

            {/* Show numbered route markers when route is active, otherwise show regular markers */}
            {showRoute && routeWithTimes ? (
              // Numbered route markers
              routeWithTimes.map((stop, idx) => (
                <Marker
                  key={stop.id}
                  position={[stop.coordinates.lat, stop.coordinates.lng]}
                  icon={createNumberedRouteIcon(stop.stopNumber, stop.stop_type)}
                >
                  <Popup maxWidth={250} className="custom-popup">
                    <PopupContent data-theme={mapStyle}>
                      <PopupStopNumber>Stop #{stop.stopNumber}</PopupStopNumber>
                      <PopupPetName $mapStyle={mapStyle}>{stop.pet_name}</PopupPetName>
                      <PopupDetail $mapStyle={mapStyle}>
                        <MapPin size={14} />
                        <span>{stop.address}</span>
                      </PopupDetail>
                      <PopupDetail $mapStyle={mapStyle}>
                        <Clock size={14} />
                        <span>Arrive: {stop.arrivalTime}</span>
                      </PopupDetail>
                      <PopupMeta $mapStyle={mapStyle}>
                        <MetaChip $stopType={stop.stop_type}>
                          {stop.stop_type === 'pickup' ? '📥 Pickup' :
                           stop.stop_type === 'dropoff' ? '📤 Dropoff' :
                           '🐕 Solo Walk'}
                        </MetaChip>
                        {idx > 0 && (
                          <MetaDuration $mapStyle={mapStyle}>
                            {stop.distanceFromPrevious} mi
                          </MetaDuration>
                        )}
                      </PopupMeta>
                    </PopupContent>
                  </Popup>
                </Marker>
              ))
            ) : (
              // Regular walk markers - grouped by location
              groupedWalksByLocation.map((locationGroup, idx) => {
                const { walks, latitude, longitude } = locationGroup;
                const count = walks.length;
                // Use first walk for icon color determination
                const primaryWalk = walks[0];

                return (
                  <Marker
                    key={`location-${idx}`}
                    position={[latitude, longitude]}
                    icon={getIconForWalk(primaryWalk, count)}
                  >
                    <Popup maxWidth={280} className="custom-popup">
                      <PopupContent data-theme={mapStyle}>
                        {count > 1 && (
                          <PopupLocationHeader $mapStyle={mapStyle}>
                            📍 {count} appointments at this location
                          </PopupLocationHeader>
                        )}
                        {walks.map((walk, walkIdx) => (
                          <PopupWalkItem key={walk.id} $isFirst={walkIdx === 0} $mapStyle={mapStyle}>
                            <PopupPetName $mapStyle={mapStyle}>{walk.pet.name}</PopupPetName>
                            {walkIdx === 0 && (
                              <PopupDetail $mapStyle={mapStyle}>
                                <MapPin size={14} />
                                <span>{walk.pet.address}</span>
                              </PopupDetail>
                            )}
                            <PopupDetail $mapStyle={mapStyle}>
                              <Clock size={14} />
                              <span>
                                {dayjs(walk.start_time, "HH:mm").format("h:mm A")} - {dayjs(walk.end_time, "HH:mm").format("h:mm A")}
                              </span>
                            </PopupDetail>
                            <PopupMeta $mapStyle={mapStyle}>
                              <MetaChip $solo={walk.solo}>
                                {walk.walk_type || (walk.solo ? 'Solo' : 'Group')}
                              </MetaChip>
                              <MetaDuration $mapStyle={mapStyle}>{walk.duration} min</MetaDuration>
                            </PopupMeta>
                            {walk.walk_group_id && (
                              <PopupGroupBadge>Grouped Walk</PopupGroupBadge>
                            )}
                          </PopupWalkItem>
                        ))}
                      </PopupContent>
                    </Popup>
                  </Marker>
                );
              })
            )}
          </StyledMapContainer>

          <MapLegend $mapStyle={mapStyle}>
            <LegendItem>
              <LegendDot color="#3B82F6" />
              <LegendLabel>Group</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#9333EA" />
              <LegendLabel>Solo</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#f59e0b" />
              <LegendLabel>Training</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#f97316" />
              <LegendLabel>Grouped</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#22c55e" />
              <LegendLabel>Completed</LegendLabel>
            </LegendItem>
          </MapLegend>

          {showRoute && optimizedRoute && (
            <RouteStatsPanel $mapStyle={mapStyle}>
              <RoutePanelClose onClick={handleToggleRoute} title="Close route view">
                <X size={18} />
              </RoutePanelClose>
              <RouteStatHeader>Optimized Route</RouteStatHeader>
              <RouteStatsRow>
                <RouteStat>
                  <RouteStatLabel>Distance</RouteStatLabel>
                  <RouteStatValue>{optimizedRoute.total_distance} mi</RouteStatValue>
                </RouteStat>
                <RouteStat>
                  <RouteStatLabel>Travel</RouteStatLabel>
                  <RouteStatValue>{optimizedRoute.total_travel_time} min</RouteStatValue>
                </RouteStat>
                {optimizedRoute.comparison && (
                  <RouteStat>
                    <RouteStatLabel>Saved</RouteStatLabel>
                    <RouteStatValue $accent>{optimizedRoute.comparison.improvement_percent}%</RouteStatValue>
                  </RouteStat>
                )}
              </RouteStatsRow>
              <TimelineToggle onClick={() => setShowTimeline(!showTimeline)}>
                <Navigation size={14} />
                {showTimeline ? 'Hide' : 'Show'} Step-by-Step
              </TimelineToggle>
            </RouteStatsPanel>
          )}

          {showRoute && showTimeline && routeWithTimes && (
            <RouteTimelinePanel $mapStyle={mapStyle}>
              <TimelineHeader>
                <Navigation size={16} />
                <span>Your Journey ({routeWithTimes.length} stops)</span>
              </TimelineHeader>
              <TimelineSteps>
                {routeWithTimes.map((stop, idx) => (
                  <TimelineStep key={stop.id}>
                    <StepNumber $stopType={stop.stop_type}>{stop.stopNumber}</StepNumber>
                    <StepContent>
                      <StepTime>{stop.arrivalTime}</StepTime>
                      <StepAction $stopType={stop.stop_type}>
                        {stop.stop_type === 'pickup' ? '📥 Pick up' :
                         stop.stop_type === 'dropoff' ? '📤 Drop off' :
                         '🐕 Walk'} {stop.pet_name}
                      </StepAction>
                      <StepAddress>{stop.address}</StepAddress>
                      {idx > 0 && stop.distanceFromPrevious > 0 && (
                        <StepDistance>
                          <ArrowRight size={12} />
                          {stop.distanceFromPrevious} mi ({stop.travelTimeFromPrevious} min walk)
                        </StepDistance>
                      )}
                    </StepContent>
                  </TimelineStep>
                ))}
              </TimelineSteps>
            </RouteTimelinePanel>
          )}
        </>
      )}
    </MapViewContainer>
  );
}

// Styled Components
const MapViewContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? '#f8f9fa' : '#14141e'};
  z-index: 9999;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  position: relative;
  overflow: hidden;

  /* Holographic shimmer effect */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.08) 50%,
      transparent 70%
    );
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }

  @media (min-width: 768px) {
    padding: 20px 24px;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
`;

const RouteToggleButton = styled.button`
  background: ${({ $active }) =>
    $active ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.15)'};
  border: 1px solid ${({ $active }) =>
    $active ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  @media (min-width: 768px) {
    width: 38px;
    height: 38px;

    &:hover:not(:disabled) {
      background: ${({ $active }) =>
        $active ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.3)'};
      border-color: ${({ $active }) =>
        $active ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.5)'};
      transform: translateY(-1px);
    }
  }
`;

const MapStyleButton = styled.button`
  background: ${({ $active }) =>
    $active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
  border: 1px solid ${({ $active }) =>
    $active ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)'};
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;

  &:active {
    transform: scale(0.95);
  }

  @media (min-width: 768px) {
    width: 38px;
    height: 38px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }
  }
`;

const MapTitle = styled.h2`
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;

  @media (min-width: 768px) {
    font-size: 1.3rem;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;

  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }

  @media (min-width: 768px) {
    width: 44px;
    height: 44px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }
  }
`;

const MapWarning = styled.div`
  background: rgba(245, 158, 11, 0.15);
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
  padding: 10px 16px;
  text-align: center;
  font-size: 0.85rem;
  color: #fbbf24;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9rem;
    padding: 12px 24px;
  }
`;

const StyledMapContainer = styled(MapContainer)`
  flex: 1;
  width: 100%;
  height: 100%;

  /* Style the Leaflet popup - Theme-aware Glass */
  .leaflet-popup-content-wrapper {
    background: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 30, 0.95)'};
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px ${({ $mapStyle }) =>
        $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'},
      inset 0 1px 0 ${({ $mapStyle }) =>
        $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
    border: 1px solid rgba(102, 126, 234, 0.3);
  }

  .leaflet-popup-tip {
    background: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 30, 0.95)'};
  }

  .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }

  .leaflet-popup-close-button {
    color: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'} !important;
    font-size: 24px !important;
    padding: 4px 8px !important;

    &:hover {
      color: ${({ $mapStyle }) =>
        $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
    }
  }

  /* Theme-aware Zoom Controls */
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  }

  .leaflet-control-zoom a {
    background: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(20, 20, 30, 0.9)'} !important;
    backdrop-filter: blur(10px);
    color: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'} !important;
    border: 1px solid rgba(102, 126, 234, 0.3) !important;
    width: 40px !important;
    height: 40px !important;
    line-height: 40px !important;
    font-size: 22px !important;
    font-weight: bold !important;
    border-radius: 12px !important;
    margin-bottom: 6px;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(102, 126, 234, 0.3) !important;
      border-color: rgba(102, 126, 234, 0.6) !important;
      color: ${({ $mapStyle }) =>
        $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.9)' : 'white'} !important;
      transform: scale(1.05);
    }

    &:first-child {
      margin-bottom: 6px;
    }
  }

  /* Theme-aware attribution control */
  .leaflet-control-attribution {
    background: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(20, 20, 30, 0.8)'} !important;
    backdrop-filter: blur(10px);
    color: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'} !important;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;

    a {
      color: rgba(102, 126, 234, 0.9) !important;
    }
  }
`;

const EmptyMapState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? '#f8f9fa' : '#14141e'};
  transition: background-color 0.3s ease;
`;

const EmptyMapIcon = styled.div`
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
  margin-bottom: 16px;
`;

const EmptyMapText = styled.h3`
  font-family: 'Poppins', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  margin: 0 0 8px 0;
`;

const EmptyMapSubtext = styled.p`
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
  margin: 0;
  max-width: 300px;
`;

const PopupContent = styled.div`
  padding: 14px;
  min-width: 200px;
`;

const PopupLocationHeader = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? '#3b82f6' : '#60a5fa'};
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PopupWalkItem = styled.div`
  ${({ $isFirst, $mapStyle }) => !$isFirst && `
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${$mapStyle === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'};
  `}
`;

const PopupPetName = styled.h3`
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? '#1a1a1a' : '#ffffff'};
  margin: 0 0 10px 0;
`;

const PopupDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};

  svg {
    flex-shrink: 0;
    color: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
  }

  span {
    line-height: 1.3;
  }
`;

const PopupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
`;

const MetaChip = styled.span`
  background: ${({ $solo }) =>
    $solo ? 'rgba(147, 51, 234, 0.25)' : 'rgba(59, 130, 246, 0.25)'
  };
  border: 1px solid ${({ $solo }) =>
    $solo ? 'rgba(147, 51, 234, 0.4)' : 'rgba(59, 130, 246, 0.4)'
  };
  color: ${({ $solo }) => $solo ? '#d8b4d8' : '#b0c4ff'};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MetaDuration = styled.span`
  color: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.8rem;
  font-weight: 500;
`;

const PopupGroupBadge = styled.div`
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(249, 115, 22, 0.2);
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 8px;
  color: #f97316;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LegendLabel = styled.span`
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
`;

const MapLegend = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 30, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  gap: 18px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'},
    inset 0 1px 0 ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(102, 126, 234, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;

  ${LegendLabel} {
    color: ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
  }

  @media (max-width: 400px) {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 14px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  flex-shrink: 0;
`;

const RouteStatsPanel = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 30, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 14px 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'},
    inset 0 1px 0 ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(59, 130, 246, 0.4);
  z-index: 10001;
  transition: all 0.3s ease;
  animation: slideDown 0.3s ease-out;
  max-width: 90vw;
  position: relative;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    top: 76px; /* Position below the map header (~68px + 8px margin) */
    width: calc(100vw - 32px);
    max-width: none;
  }
`;

const RoutePanelClose = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.6);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    top: 8px;
    right: 8px;
  }
`;

const RouteStatHeader = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(59, 130, 246, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 10px;
  text-align: center;
`;

const RouteStatsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const RouteStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const RouteStatLabel = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RouteStatValue = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $accent }) => $accent ? '#22c55e' : '#ffffff'};
`;

const TimelineToggle = styled.button`
  margin-top: 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;

  &:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
  }
`;

const RouteTimelinePanel = styled.div`
  position: absolute;
  top: 120px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 200px);
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 30, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'},
    inset 0 1px 0 ${({ $mapStyle }) =>
      $mapStyle === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(59, 130, 246, 0.4);
  z-index: 10002;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-out;

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 768px) {
    right: 10px;
    left: 10px;
    width: auto;
    max-width: none;
    top: 220px; /* Position below route stats panel (76px + ~130px panel + 14px gap) */
    max-height: calc(100vh - 240px);
  }
`;

const TimelineHeader = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(59, 130, 246, 0.9);
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const TimelineSteps = styled.div`
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  }
`;

const TimelineStep = styled.div`
  display: flex;
  gap: 12px;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 19px;
    top: 40px;
    bottom: -12px;
    width: 2px;
    background: rgba(59, 130, 246, 0.2);
  }
`;

const StepNumber = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${({ $stopType }) =>
    $stopType === 'pickup' ? 'rgba(59, 130, 246, 0.3)' :
    $stopType === 'dropoff' ? 'rgba(34, 197, 94, 0.3)' :
    'rgba(147, 51, 234, 0.3)'};
  border: 2px solid ${({ $stopType }) =>
    $stopType === 'pickup' ? '#3b82f6' :
    $stopType === 'dropoff' ? '#22c55e' :
    '#9333ea'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StepTime = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(59, 130, 246, 0.9);
`;

const StepAction = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ $stopType }) =>
    $stopType === 'pickup' ? '#3b82f6' :
    $stopType === 'dropoff' ? '#22c55e' :
    '#9333ea'};
`;

const StepAddress = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;

const StepDistance = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
`;

const PopupStopNumber = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(59, 130, 246, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;
