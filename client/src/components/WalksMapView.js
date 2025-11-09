import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { X, MapPin, Clock, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different walk types
const createCustomIcon = (color, completed = false) => {
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
    ">
      ${completed ? '<div style="color: white; font-size: 18px;">✓</div>' : ''}
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
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

  // Filter and categorize walks
  const { geocodedWalks, nonGeocodedCount } = useMemo(() => {
    const geocoded = walks.filter(w => w.pet?.latitude && w.pet?.longitude);
    const nonGeocoded = walks.length - geocoded.length;
    return {
      geocodedWalks: geocoded,
      nonGeocodedCount: nonGeocoded
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
  const getIconForWalk = (walk) => {
    const completed = isCompleted(walk);

    if (completed) {
      return createCustomIcon('#22c55e', true); // Green for completed
    }

    const walkType = walk.walk_type || (walk.solo ? 'solo' : 'group');
    if (walkType === 'solo') {
      return createCustomIcon('#9333EA', false); // Purple for solo
    } else if (walkType === 'training') {
      return createCustomIcon('#f59e0b', false); // Amber for training
    }
    return createCustomIcon('#3B82F6', false); // Blue for group
  };

  // Don't render anything if walks is null/undefined
  if (!walks || walks.length === 0) {
    return (
      <MapViewContainer>
        <MapHeader>
          <MapTitle>
            <MapPin size={20} />
            Today's Walks Map
          </MapTitle>
          <CloseButton onClick={onClose} title="Close map">
            <X size={24} />
          </CloseButton>
        </MapHeader>
        <EmptyMapState>
          <EmptyMapIcon>
            <MapPin size={48} />
          </EmptyMapIcon>
          <EmptyMapText>No walks scheduled today</EmptyMapText>
          <EmptyMapSubtext>Schedule some walks to see them on the map</EmptyMapSubtext>
        </EmptyMapState>
      </MapViewContainer>
    );
  }

  return (
    <MapViewContainer>
      <MapHeader>
        <MapTitle>
          <MapPin size={20} />
          Today's Walks Map
        </MapTitle>
        <CloseButton onClick={onClose} title="Close map">
          <X size={24} />
        </CloseButton>
      </MapHeader>

      {nonGeocodedCount > 0 && (
        <MapWarning>
          ⚠️ {nonGeocodedCount} walk{nonGeocodedCount !== 1 ? 's' : ''} without location data
        </MapWarning>
      )}

      {geocodedWalks.length === 0 ? (
        <EmptyMapState>
          <EmptyMapIcon>
            <MapPin size={48} />
          </EmptyMapIcon>
          <EmptyMapText>No walks with location data yet</EmptyMapText>
          <EmptyMapSubtext>Add addresses to your pets to see them on the map</EmptyMapSubtext>
        </EmptyMapState>
      ) : (
        <>
          <StyledMapContainer
            center={mapCenter}
            zoom={13}
            ref={mapRef}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <AutoFitBounds walks={geocodedWalks} />

            {geocodedWalks.map(walk => (
              <Marker
                key={walk.id}
                position={[walk.pet.latitude, walk.pet.longitude]}
                icon={getIconForWalk(walk)}
              >
                <Popup maxWidth={250} className="custom-popup">
                  <PopupContent>
                    <PopupPetName>{walk.pet.name}</PopupPetName>
                    <PopupDetail>
                      <MapPin size={14} />
                      <span>{walk.pet.address}</span>
                    </PopupDetail>
                    <PopupDetail>
                      <Clock size={14} />
                      <span>
                        {dayjs(walk.start_time, "HH:mm").format("h:mm A")} - {dayjs(walk.end_time, "HH:mm").format("h:mm A")}
                      </span>
                    </PopupDetail>
                    <PopupMeta>
                      <MetaChip $solo={walk.solo}>
                        {walk.walk_type || (walk.solo ? 'Solo' : 'Group')}
                      </MetaChip>
                      <MetaDuration>{walk.duration} min</MetaDuration>
                    </PopupMeta>
                  </PopupContent>
                </Popup>
              </Marker>
            ))}
          </StyledMapContainer>

          <MapLegend>
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
  background: #1a1a2e;
  z-index: 9999;
  display: flex;
  flex-direction: column;
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1000;

  @media (min-width: 768px) {
    padding: 20px 24px;
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

  /* Style the Leaflet popup */
  .leaflet-popup-content-wrapper {
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .leaflet-popup-tip {
    background: #2D1B2E;
  }

  .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }

  /* Style Leaflet controls for mobile */
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  }

  .leaflet-control-zoom a {
    background: rgba(255, 255, 255, 0.9) !important;
    color: #333 !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 20px !important;
    border-radius: 8px !important;
    margin-bottom: 4px;

    &:hover {
      background: white !important;
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
  background: #1a1a2e;
`;

const EmptyMapIcon = styled.div`
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
`;

const EmptyMapText = styled.h3`
  font-family: 'Poppins', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 8px 0;
`;

const EmptyMapSubtext = styled.p`
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  max-width: 300px;
`;

const PopupContent = styled.div`
  padding: 14px;
  min-width: 200px;
`;

const PopupPetName = styled.h3`
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 10px 0;
`;

const PopupDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);

  svg {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.6);
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 500;
`;

const MapLegend = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;

  @media (max-width: 400px) {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
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

const LegendLabel = styled.span`
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
`;
