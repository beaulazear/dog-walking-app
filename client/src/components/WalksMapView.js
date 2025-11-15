import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { X, MapPin, Clock, DollarSign, Moon, Sun, Mountain, Route, List } from 'lucide-react';
import dayjs from 'dayjs';
import RouteJourneyPanel from './RouteJourneyPanel';
import { calculateRouteWithTimes } from '../utils/routeCalculations';

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
    return calculateRouteWithTimes(optimizedRoute);
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
            <CloseButton onClick={onClose} title="Back to list">
              <List size={24} />
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
          <CloseButton onClick={onClose} title="Back to list">
            <List size={24} />
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
              <LegendDot color="#22c55e" />
              <LegendLabel>Completed</LegendLabel>
            </LegendItem>
          </MapLegend>

          {showRoute && showTimeline && routeWithTimes && (
            <RouteJourneyPanel
              routeWithTimes={routeWithTimes}
              onClose={handleToggleRoute}
              inline={false}
              mapStyle={mapStyle}
            />
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
  bottom: 80px; /* Leave space for bottom navigation */
  background: ${({ $mapStyle }) =>
    $mapStyle === 'light' ? '#f8f9fa' : '#14141e'};
  z-index: 9999;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    bottom: 70px; /* Slightly less on mobile */
  }
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
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  backdrop-filter: blur(12px);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(251, 191, 36, 0.4),
    0 0 20px rgba(251, 191, 36, 0.3);
  position: relative;
  overflow: hidden;
  z-index: 1;

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
      rgba(255, 255, 255, 0.5) 50%,
      transparent 70%
    );
    animation: gleam 3s infinite;
  }

  @keyframes gleam {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 6px 16px rgba(251, 191, 36, 0.5),
      0 0 25px rgba(251, 191, 36, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  svg {
    position: relative;
    z-index: 1;
  }

  @media (min-width: 768px) {
    width: 44px;
    height: 44px;

    svg {
      width: 20px;
      height: 20px;
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
  bottom: 100px;
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

  @media (max-width: 768px) {
    bottom: 100px;
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

const PopupStopNumber = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(59, 130, 246, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;
