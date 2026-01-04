import styled from "styled-components";

// ======================
// MAIN PAGE COMPONENTS
// ======================

export const Container = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 8px 16px;
    padding-top: 140px;
    padding-bottom: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 2px, transparent 2px),
            radial-gradient(circle at 80% 40%, rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.06) 2.5px, transparent 2.5px),
            radial-gradient(circle at 15% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(circle at 90% 15%, rgba(255,255,255,0.04) 1.5px, transparent 1.5px);
        background-size: 80px 80px, 60px 60px, 40px 40px, 100px 100px, 30px 30px, 70px 70px;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        padding: 16px 0;
        padding-top: 90px;
        padding-bottom: 140px;
    }
`;

export const Header = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (max-width: 768px) {
        padding: 16px 12px;
    }
`;

export const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

export const PageTitle = styled.h1`
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    @media (min-width: 768px) {
        font-size: 32px;
    }
`;

export const PageSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

export const HeaderButtonGroup = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    margin-right: 16px;
`;

export const OptimizedRouteButton = styled.button`
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

    &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow:
            0 6px 20px rgba(251, 191, 36, 0.5),
            0 0 30px rgba(251, 191, 36, 0.4);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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

export const HeaderButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);

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
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
        );
        transform: rotate(45deg);
        animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
        }
    }

    &:active {
        transform: scale(0.95);
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
        );
    }

    @media (min-width: 768px) {
        width: 44px;
        height: 44px;

        svg {
            width: 20px;
            height: 20px;
        }

        &:hover {
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.25),
                rgba(255, 255, 255, 0.1)
            );
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-2px);
            box-shadow:
                0 6px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
    }
`;

// ======================
// ROUTE DISPLAY
// ======================

export const RouteDisplayContainer = styled.div`
    width: 100%;
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border-top: 2px solid rgba(251, 191, 36, 0.4);
    border-bottom: 2px solid rgba(251, 191, 36, 0.4);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    margin-bottom: 0;
    position: relative;
    z-index: 1;
`;

export const RouteHeader = styled.div`
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

export const RouteHeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
`;

export const RouteTitle = styled.div`
    color: rgba(251, 191, 36, 0.95);
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
`;

export const RouteSummary = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
`;

export const CloseRouteButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

export const RouteStops = styled.div`
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(251, 191, 36, 0.3);
        border-radius: 3px;

        &:hover {
            background: rgba(251, 191, 36, 0.5);
        }
    }
`;

export const RouteStop = styled.div`
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
        background: rgba(251, 191, 36, 0.2);
    }
`;

export const StopNumber = styled.div`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: ${({ $type }) =>
        $type === 'pickup'
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

export const StopDetails = styled.div`
    flex: 1;
    padding-top: 2px;
`;

export const StopType = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${props => props.$type === 'pickup' ? '#10b981' : '#8b5cf6'};
    margin-bottom: 4px;
`;

export const StopName = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
`;

export const StopTime = styled.div`
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
`;

// ======================
// EMPTY STATE
// ======================

export const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 32px;
    text-align: center;
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.8), rgba(107, 43, 107, 0.6));
    border-radius: 0;
    border: none;
    backdrop-filter: blur(15px);
    box-shadow: none;
    max-width: 500px;
    width: 100%;

    @media (min-width: 768px) {
        padding: 60px 40px;
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
`;

export const EmptyIcon = styled.div`
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
`;

export const EmptyTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

export const EmptyText = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    max-width: 350px;
    line-height: 1.5;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

// ======================
// WALK LIST
// ======================

export const WalkList = styled.div`
    width: 100%;
    max-width: 448px;
    display: flex;
    flex-direction: column;
    gap: 0;

    @media (min-width: 768px) {
        gap: 12px;
    }
`;

// ======================
// WALK CARD
// ======================

export const Card = styled.div`
    background: ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(255, 255, 255, 0.18)' :
        $cancelled ? 'rgba(255, 255, 255, 0.12)' :
        'rgba(255, 255, 255, 0.15)'
    };
    backdrop-filter: blur(20px);
    border-radius: 0;
    border: none;
    border-bottom: 2px solid ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(6, 182, 212, 0.5)' :
        $cancelled ? 'rgba(251, 146, 60, 0.5)' :
        'rgba(255, 255, 255, 0.25)'
    };
    box-shadow: none;
    transition: all 0.2s ease;
    opacity: ${({ $cancelled }) => $cancelled ? 0.7 : 1};

    &:active {
        background: ${({ $completed, $cancelled }) =>
            $completed ? 'rgba(255, 255, 255, 0.22)' :
            $cancelled ? 'rgba(255, 255, 255, 0.16)' :
            'rgba(255, 255, 255, 0.2)'
        };
    }

    @media (min-width: 769px) {
        border-radius: 16px;
        border: 2px solid ${({ $completed, $cancelled }) =>
            $completed ? 'rgba(6, 182, 212, 0.5)' :
            $cancelled ? 'rgba(251, 146, 60, 0.5)' :
            'rgba(255, 255, 255, 0.3)'
        };
        box-shadow: ${({ $completed, $cancelled }) =>
            $completed ? '0 4px 16px rgba(6, 182, 212, 0.3)' :
            $cancelled ? '0 4px 16px rgba(251, 146, 60, 0.3)' :
            '0 4px 16px rgba(0, 0, 0, 0.15)'
        };

        &:hover {
            transform: translateY(-2px);
            box-shadow: ${({ $completed, $cancelled }) =>
                $completed ? '0 8px 24px rgba(6, 182, 212, 0.4)' :
                $cancelled ? '0 8px 24px rgba(251, 146, 60, 0.4)' :
                '0 8px 24px rgba(0, 0, 0, 0.2)'
            };
        }
    }
`;

export const CardContent = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    position: relative;

    @media (max-width: 768px) {
        padding: 18px 14px;
        gap: 12px;
    }
`;

export const WalkDetails = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.9;
    }

    &:active {
        opacity: 0.8;
    }
`;

export const TopRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-right: 32px;
`;

export const PetName = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;

    @media (max-width: 768px) {
        font-size: 1.1rem;
    }
`;

export const WalkTime = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    white-space: nowrap;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

export const Address = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;

    svg {
        flex-shrink: 0;
        margin-top: 2px;
    }

    @media (max-width: 768px) {
        font-size: 0.8rem;
    }
`;

export const WalkInfo = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

export const InfoItem = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.75rem;
    font-weight: 600;

    @media (max-width: 768px) {
        font-size: 0.78rem;
    }
`;

export const InfoDivider = styled.span`
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-weight: 700;
`;

export const InfoIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;

    svg {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    ${WalkDetails}:hover & {
        color: rgba(255, 255, 255, 0.95);
        transform: scale(1.1);
    }
`;

export const EarningsDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding: 6px 10px;
    background: rgba(6, 182, 212, 0.3);
    border-radius: 8px;
    border: 2px solid rgba(6, 182, 212, 0.6);
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);

    @media (max-width: 768px) {
        padding: 5px 8px;
    }
`;

export const EarningsAmount = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 800;
    color: #22d3ee;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

export const ActionButtons = styled.div`
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;

    @media (max-width: 768px) {
        gap: 8px;
    }
`;

const actionButtonBase = `
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:active {
        transform: scale(0.95);
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 12px;
    }
`;

export const ShareButton = styled.button`
    ${actionButtonBase}
    background: rgba(102, 126, 234, 0.35);
    border: 2px solid rgba(102, 126, 234, 0.7);
    color: #8b9eff;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

    @media (min-width: 769px) {
        &:hover {
            background: rgba(102, 126, 234, 0.5);
            border-color: rgba(102, 126, 234, 0.9);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    }
`;

export const CompleteButton = styled.button`
    ${actionButtonBase}
    background: rgba(6, 182, 212, 0.35);
    border: 2px solid rgba(6, 182, 212, 0.7);
    color: #22d3ee;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);

    @media (min-width: 769px) {
        &:hover {
            background: rgba(6, 182, 212, 0.5);
            border-color: rgba(6, 182, 212, 0.9);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }
    }
`;

export const CancelButton = styled.button`
    ${actionButtonBase}
    background: rgba(251, 146, 60, 0.35);
    border: 2px solid rgba(251, 146, 60, 0.7);
    color: #fbbf24;
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);

    @media (min-width: 769px) {
        &:hover {
            background: rgba(251, 146, 60, 0.5);
            border-color: rgba(251, 146, 60, 0.9);
            box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
        }
    }
`;

// Status Badges
export const DelegatedBadge = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(102, 126, 234, 0.35);
    border: 2px solid rgba(102, 126, 234, 0.7);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8b9eff;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);

    @media (max-width: 768px) {
        font-size: 10px;
        padding: 3px 6px;
    }
`;

export const CoveringBadge = styled.div`
    margin-top: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.4));
    border: 2px solid rgba(16, 185, 129, 0.8);
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.4);
    width: fit-content;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    svg {
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    @media (max-width: 768px) {
        font-size: 12px;
        padding: 6px 10px;
    }
`;

export const CoveredByBadge = styled.div`
    margin-top: 8px;
    padding: 6px 10px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25));
    border: 2px solid rgba(99, 102, 241, 0.6);
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6366f1;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    width: fit-content;

    svg {
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        font-size: 11px;
        padding: 5px 8px;
    }
`;

export const CompletedBadge = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    background: rgba(6, 182, 212, 0.35);
    border: 2px solid rgba(6, 182, 212, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22d3ee;
    box-shadow: 0 2px 6px rgba(6, 182, 212, 0.3);
    z-index: 5;

    @media (max-width: 768px) {
        width: 26px;
        height: 26px;
        top: 10px;
        right: 10px;
    }
`;

export const CancelledBadge = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    background: rgba(251, 146, 60, 0.35);
    border: 2px solid rgba(251, 146, 60, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
    box-shadow: 0 2px 6px rgba(251, 146, 60, 0.3);
    z-index: 5;

    @media (max-width: 768px) {
        width: 26px;
        height: 26px;
        top: 10px;
        right: 10px;
    }
`;

// ======================
// DAILY TOTAL
// ======================

export const DailyTotalCard = styled.div`
    width: 100%;
    max-width: 448px;
    margin-top: 0;
    padding: 20px 12px;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(20px);
    border-radius: 0;
    border: none;
    border-top: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: none;
    text-align: center;

    @media (min-width: 768px) {
        padding: 20px;
        margin-top: 20px;
        border-radius: 16px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
`;

export const DailyTotalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;

    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

export const DailyTotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #22d3ee;
    margin-bottom: 8px;
    text-shadow: 0 2px 12px rgba(6, 182, 212, 0.5);

    @media (max-width: 768px) {
        font-size: 2rem;
    }
`;

export const DailyTotalSub = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

// ======================
// COMPLETION MODAL
// ======================

export const CompletionModalContainer = styled.div`
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    width: 100%;
    max-width: 500px;
    max-height: 95vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
    border-radius: 24px 24px 0 0;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }
`;

export const CompletionModalDragHandle = styled.div`
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;

    @media (min-width: 768px) {
        display: none;
    }
`;

export const CompletionModalHeader = styled.div`
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CompletionModalHeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

export const CompletionModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;

    @media (max-width: 767px) {
        font-size: 1.1rem;
    }
`;

export const CompletionModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const PetInfoBanner = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const PetNameLarge = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.02em;

    @media (max-width: 767px) {
        font-size: 1.3rem;
    }
`;

export const WalkMetadata = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const WalkTypeChip = styled.div`
    background: ${({ $solo }) =>
        $solo ? 'rgba(165, 105, 167, 0.25)' : 'rgba(102, 126, 234, 0.25)'
    };
    border: 1px solid ${({ $solo }) =>
        $solo ? 'rgba(165, 105, 167, 0.4)' : 'rgba(102, 126, 234, 0.4)'
    };
    color: ${({ $solo }) => $solo ? '#d8b4d8' : '#b0c4ff'};
    padding: 4px 10px;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

export const WalkTimeText = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;

    @media (max-width: 767px) {
        font-size: 0.8rem;
    }
`;

export const CompletionModalContent = styled.div`
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    @media (max-width: 767px) {
        padding: 20px 16px 24px;
        gap: 16px;
    }
`;

export const CompensationCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
`;

export const CompensationCardTitle = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
`;

export const CompensationBreakdown = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const CompensationItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const CompensationItemLabel = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
`;

export const CompensationItemValue = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: ${({ $accent }) => $accent ? '#d8b4d8' : '#ffffff'};
`;

export const DurationSection = styled.div``;

export const SectionLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
`;

export const DurationSelector = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
`;

export const DurationOption = styled.button`
    background: ${({ $active }) =>
        $active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'rgba(255, 255, 255, 0.08)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? '#a569a7' : 'rgba(255, 255, 255, 0.12)'
    };
    border-radius: 14px;
    padding: 16px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 68px;

    &:hover:not(:disabled) {
        background: ${({ $active }) =>
            $active ? 'linear-gradient(135deg, #7d527e, #936394)' : 'rgba(255, 255, 255, 0.12)'
        };
        border-color: ${({ $active }) => $active ? '#936394' : 'rgba(255, 255, 255, 0.2)'};
        transform: scale(1.02);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 14px 10px;
        min-height: 64px;
    }
`;

export const DurationTime = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;

    @media (max-width: 767px) {
        font-size: 1.3rem;
    }
`;

export const DurationUnit = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
`;

export const AdjustmentSection = styled.div``;

export const AdjustmentTypeToggle = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
`;

export const AdjustmentTypeButton = styled.button`
    background: ${({ $active }) =>
        $active ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
    };
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${({ $active }) => $active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 10px 14px;
        font-size: 0.85rem;
    }
`;

export const AdjustmentInput = styled.div`
    position: relative;
    display: flex;
    align-items: center;

    svg {
        position: absolute;
        left: 16px;
        color: rgba(255, 255, 255, 0.6);
        z-index: 1;
    }

    input {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 14px 16px 14px 48px;
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
        transition: all 0.2s ease;

        &::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
            outline: none;
            border-color: rgba(165, 105, 167, 0.5);
            background: rgba(255, 255, 255, 0.12);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
`;

export const SplitSection = styled.div`
    margin: 16px 0;
`;

export const SplitInfo = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 12px;
`;

export const SplitSliderContainer = styled.div`
    padding: 16px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    margin-bottom: 12px;
`;

export const SplitSlider = styled.input`
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    margin-bottom: 12px;
    cursor: pointer;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #667eea;
        cursor: pointer;
        border-radius: 50%;
        border: 3px solid white;
    }

    &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #667eea;
        cursor: pointer;
        border-radius: 50%;
        border: 3px solid white;
    }
`;

export const SplitLabels = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const SplitLabel = styled.div`
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    font-weight: 600;
`;

export const SplitBreakdown = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
`;

export const SplitItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;

    &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
`;

export const SplitItemLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
`;

export const SplitItemValue = styled.div`
    color: #ffffff;
    font-weight: 600;
    font-size: 0.95rem;
`;

export const TotalCard = styled.div`
    background: ${({ $positive }) =>
        $positive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(251, 146, 60, 0.2)'
    };
    border: 2px solid ${({ $positive }) =>
        $positive ? 'rgba(6, 182, 212, 0.4)' : 'rgba(251, 146, 60, 0.4)'
    };
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    @media (max-width: 767px) {
        padding: 16px;
    }
`;

export const TotalLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.8px;
`;

export const TotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;

    @media (max-width: 767px) {
        font-size: 2rem;
    }
`;

export const ModalActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
`;

export const ConfirmButton = styled.button`
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border: none;
    border-radius: 16px;
    padding: 18px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
    letter-spacing: -0.01em;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0891b2, #0e7490);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(6, 182, 212, 0.5);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 16px 20px;
        font-size: 1rem;
    }
`;

export const CancelActionButton = styled.button`
    background: transparent;
    border: none;
    border-radius: 16px;
    padding: 14px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 12px 20px;
        font-size: 0.9rem;
    }
`;

// ======================
// CANCEL MODAL
// ======================

export const CancelModalContainer = styled.div`
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    width: 100%;
    max-width: 480px;
    max-height: 95vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
    border-radius: 24px 24px 0 0;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }
`;

export const CancelModalDragHandle = styled.div`
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;

    @media (min-width: 768px) {
        display: none;
    }
`;

export const CancelModalHeader = styled.div`
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CancelModalHeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

export const CancelModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fb923c;
    margin: 0;
    letter-spacing: -0.01em;

    @media (max-width: 767px) {
        font-size: 1.1rem;
    }
`;

export const CancelModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const CancelModalContent = styled.div`
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    @media (max-width: 767px) {
        padding: 20px 16px 24px;
        gap: 16px;
    }
`;

export const CancellationInfoCard = styled.div`
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.3);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;

    @media (max-width: 767px) {
        padding: 16px;
        gap: 12px;
    }
`;

export const CancellationWarning = styled.div`
    width: 44px;
    height: 44px;
    background: rgba(251, 146, 60, 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fb923c;

    @media (max-width: 767px) {
        width: 40px;
        height: 40px;
    }
`;

export const CancellationMessage = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 8px 0 0;
    line-height: 1.5;
    font-weight: 500;

    @media (max-width: 767px) {
        font-size: 0.9rem;
    }
`;

export const CancellationFeeSection = styled.div``;

export const FeeInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    svg {
        position: absolute;
        left: 16px;
        color: rgba(255, 255, 255, 0.6);
        z-index: 1;
    }

    input {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 14px 16px 14px 50px;
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
        transition: all 0.2s ease;

        &::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
            outline: none;
            border-color: rgba(251, 146, 60, 0.6);
            background: rgba(255, 255, 255, 0.12);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        &[type=number] {
            -moz-appearance: textfield;
        }
    }
`;

export const FeeHint = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.4;

    @media (max-width: 767px) {
        font-size: 0.8rem;
    }
`;

export const CancelModalActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
`;

export const CancelWalkButton = styled.button`
    background: linear-gradient(135deg, #fb923c, #f97316);
    border: none;
    border-radius: 16px;
    padding: 18px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(251, 146, 60, 0.4);
    letter-spacing: -0.01em;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #f97316, #ea580c);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(251, 146, 60, 0.5);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 16px 20px;
        font-size: 1rem;
    }
`;

export const KeepWalkButton = styled.button`
    background: transparent;
    border: none;
    border-radius: 16px;
    padding: 14px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 12px 20px;
        font-size: 0.9rem;
    }
`;

// ======================
// PET DETAILS MODAL
// ======================

export const PetModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10003;
    padding: 20px;
`;

export const PetModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 20px;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
`;

export const PetModalHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const PetHeaderInfo = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const PetModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

export const PetModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.1);
    }
`;

export const PetModalContent = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const PetModalAvatar = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid rgba(165, 105, 167, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
`;

export const PetModalName = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const PetAddress = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        opacity: 0.8;
    }
`;

// Basic Info Row (Compact)
export const BasicInfoRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const BasicInfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);

    svg {
        color: rgba(165, 105, 167, 0.9);
        flex-shrink: 0;
    }

    span {
        white-space: nowrap;
    }
`;

export const BasicInfoDivider = styled.div`
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
`;

// Alert Sections (Highlighted Important Info)
export const AlertSection = styled.div`
    padding: 16px 18px;
    border-radius: 14px;
    background: ${({ $variant }) =>
        $variant === 'danger' ? 'rgba(239, 68, 68, 0.12)' :
        $variant === 'warning' ? 'rgba(245, 158, 11, 0.12)' :
        'rgba(59, 130, 246, 0.12)'
    };
    border: 2px solid ${({ $variant }) =>
        $variant === 'danger' ? 'rgba(239, 68, 68, 0.35)' :
        $variant === 'warning' ? 'rgba(245, 158, 11, 0.35)' :
        'rgba(59, 130, 246, 0.35)'
    };
    box-shadow: ${({ $variant }) =>
        $variant === 'danger' ? '0 4px 16px rgba(239, 68, 68, 0.15)' :
        $variant === 'warning' ? '0 4px 16px rgba(245, 158, 11, 0.15)' :
        '0 4px 16px rgba(59, 130, 246, 0.15)'
    };
`;

export const AlertHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
`;

export const AlertIcon = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.2rem;
    flex-shrink: 0;
    background: ${({ $variant }) =>
        $variant === 'danger' ? 'rgba(239, 68, 68, 0.25)' :
        $variant === 'warning' ? 'rgba(245, 158, 11, 0.25)' :
        'rgba(59, 130, 246, 0.25)'
    };
    color: ${({ $variant }) =>
        $variant === 'danger' ? '#fca5a5' :
        $variant === 'warning' ? '#fcd34d' :
        '#93c5fd'
    };
    box-shadow: ${({ $variant }) =>
        $variant === 'danger' ? '0 2px 8px rgba(239, 68, 68, 0.2)' :
        $variant === 'warning' ? '0 2px 8px rgba(245, 158, 11, 0.2)' :
        '0 2px 8px rgba(59, 130, 246, 0.2)'
    };
`;

export const AlertTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
`;

export const AlertText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    line-height: 1.6;
    font-weight: 400;
    padding-left: 44px;
`;

// ======================
// PET SIT SPECIFIC
// ======================

export const PetSitDescription = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.8rem;
    font-weight: 400;
    margin-top: 4px;
    line-height: 1.4;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 2px solid rgba(165, 105, 167, 0.5);

    @media (max-width: 768px) {
        font-size: 0.75rem;
    }
`;

export const ViewAllDatesLink = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    color: rgba(165, 105, 167, 1);
    font-weight: 600;
    margin-top: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: fit-content;

    svg {
        width: 12px;
        height: 12px;
    }

    &:hover {
        color: rgba(165, 105, 167, 0.8);
        text-decoration: underline;
    }
`;

// ======================
// ALL DATES MODAL
// ======================

export const AllDatesModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
`;

export const AllDatesModalContent = styled.div`
    background: linear-gradient(135deg, rgba(68, 35, 100, 0.95) 0%, rgba(45, 23, 66, 0.95) 100%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;

    @media (max-width: 768px) {
        padding: 20px;
        max-height: 90vh;
    }
`;

export const AllDatesHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const AllDatesTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;

    @media (max-width: 768px) {
        font-size: 1.1rem;
    }
`;

export const CloseModalButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
`;

export const AllDatesInfo = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 16px;
    text-align: center;
`;

export const AllDatesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    max-height: 400px;
    padding-right: 8px;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(165, 105, 167, 0.5);
        border-radius: 3px;

        &:hover {
            background: rgba(165, 105, 167, 0.7);
        }
    }
`;

export const DateRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(165, 105, 167, 0.3);
    }
`;

export const DateLabel = styled.div`
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
`;

export const DateCompletedBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: rgba(16, 185, 129, 1);
    font-weight: 600;

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const DateCompleteButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(165, 105, 167, 0.2);
    border: 1px solid rgba(165, 105, 167, 0.4);
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover {
        background: rgba(165, 105, 167, 0.3);
        border-color: rgba(165, 105, 167, 0.6);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(165, 105, 167, 0.3);
    }

    &:active {
        transform: translateY(0);
    }
`;
