import React from 'react';
import styled from 'styled-components';
import { X, Navigation, ArrowRight } from 'lucide-react';

export default function RouteJourneyPanel({
  routeWithTimes,
  onClose,
  inline = false,
  mapStyle = 'dark'
}) {
  if (!routeWithTimes || routeWithTimes.length === 0) return null;

  return (
    <TimelinePanel $inline={inline} $mapStyle={mapStyle}>
      <TimelineCloseButton onClick={onClose} title="Hide route">
        <X size={18} />
      </TimelineCloseButton>
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
    </TimelinePanel>
  );
}

// Styled Components
const TimelinePanel = styled.div`
  ${({ $inline }) => $inline ? `
    width: 100%;
    position: relative;
    margin-bottom: 0;
  ` : `
    position: absolute;
    top: 100px;
    right: 20px;
    width: 320px;
    max-height: calc(100vh - 200px);
    z-index: 10002;
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
      top: 80px;
      max-height: calc(100vh - 170px);
    }
  `}

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
  display: flex;
  flex-direction: column;

  ${({ $inline }) => $inline && `
    border-top: 2px solid rgba(59, 130, 246, 0.4);
    border-bottom: 2px solid rgba(59, 130, 246, 0.4);
  `}
`;

const TimelineCloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
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
    top: 10px;
    right: 10px;
  }
`;

const TimelineHeader = styled.div`
  padding: 14px 16px;
  padding-right: 48px; /* Make room for close button */
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
  max-height: 500px;

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
