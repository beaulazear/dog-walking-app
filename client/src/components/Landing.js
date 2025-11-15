import React, { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, PawPrint } from "lucide-react";
import dogImage from "../assets/dog.png";

const Landing = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <LandingWrapper>
            <BackgroundPattern />

            <TopHeader>
                <AppTitle src="/PocketWalks.svg" alt="Pocket Walks" />
            </TopHeader>

            <ContentContainer>
                <HeaderSection>
                    <LogoContainer>
                        <DogImage src={dogImage} alt="Dog Walking App" />
                    </LogoContainer>
                    <AppSubtitle>Manage your walks, clients, and schedule</AppSubtitle>
                </HeaderSection>

                <ActionsContainer>
                    <ActionButton
                        $primary
                        onClick={() => navigate('/login')}
                        aria-label="Login to your account"
                    >
                        <LogIn size={20} />
                        <span>Login</span>
                    </ActionButton>

                    <ActionButton
                        onClick={() => navigate('/signup')}
                        aria-label="Create new account"
                    >
                        <UserPlus size={20} />
                        <span>Sign Up</span>
                    </ActionButton>
                </ActionsContainer>

                <FeaturesList>
                    <FeatureItem>
                        <PawPrint size={16} />
                        <span>Track daily walks</span>
                    </FeatureItem>
                    <FeatureItem>
                        <PawPrint size={16} />
                        <span>Manage clients & pets</span>
                    </FeatureItem>
                    <FeatureItem>
                        <PawPrint size={16} />
                        <span>Team collaboration</span>
                    </FeatureItem>
                </FeaturesList>
            </ContentContainer>
        </LandingWrapper>
    );
};

export default Landing;

// Animations
const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

// Styled Components
const LandingWrapper = styled.div`
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
    position: relative;
    overflow: hidden;

    @media (max-width: 768px) {
        padding: 1rem 1rem 2rem;
    }
`;

const BackgroundPattern = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-image:
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1px, transparent 1px),
        radial-gradient(circle at 60% 70%, rgba(255,255,255,0.2) 1px, transparent 1px),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 1px, transparent 1px);
    background-size: 50px 50px, 80px 80px, 60px 60px;
    pointer-events: none;
`;

const TopHeader = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 0.625rem 2rem;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;

    @media (max-width: 768px) {
        padding: 0.5rem 1.5rem;
    }

    @media (max-width: 480px) {
        padding: 0.5rem 1rem;
    }
`;

const ContentContainer = styled.div`
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    animation: ${fadeIn} 0.8s ease-out;
    z-index: 1;
    padding-top: 125px;

    @media (max-width: 768px) {
        gap: 1.5rem;
        max-width: 100%;
        padding-top: 105px;
    }

    @media (max-width: 480px) {
        padding-top: 90px;
    }
`;

const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;

    @media (max-width: 768px) {
        gap: 0.75rem;
    }
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ${float} 3s ease-in-out infinite;
`;

const DogImage = styled.img`
    width: 100px;
    height: 100px;
    display: block;
    object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));

    @media (max-width: 768px) {
        width: 85px;
        height: 85px;
    }
`;

const AppTitle = styled.img`
    height: 85px;
    width: auto;
    max-width: 450px;
    display: block;

    @media (max-width: 768px) {
        height: 70px;
        max-width: 360px;
    }

    @media (max-width: 480px) {
        height: 58px;
        max-width: 280px;
    }
`;

const AppSubtitle = styled.p`
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);

    @media (max-width: 768px) {
        font-size: 0.95rem;
    }
`;

const ActionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;

    @media (max-width: 768px) {
        gap: 0.875rem;
    }
`;

const ActionButton = styled.button`
    background: ${props => props.$primary
        ? 'rgba(255, 255, 255, 0.98)'
        : 'rgba(255, 255, 255, 0.15)'};
    backdrop-filter: blur(10px);
    color: ${props => props.$primary ? '#4c51bf' : '#ffffff'};
    border: 2px solid ${props => props.$primary
        ? 'rgba(255, 255, 255, 0.5)'
        : 'rgba(255, 255, 255, 0.3)'};
    padding: 1.125rem 2rem;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 1.0625rem;
    font-weight: 600;
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${props => props.$primary
        ? '0 8px 24px rgba(0, 0, 0, 0.15)'
        : '0 4px 16px rgba(0, 0, 0, 0.1)'};
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            ${props => props.$primary
                ? 'rgba(76, 81, 191, 0.1)'
                : 'rgba(255, 255, 255, 0.15)'},
            transparent
        );
        animation: ${shimmer} 3s infinite;
    }

    &:hover {
        transform: translateY(-2px);
        background: ${props => props.$primary
            ? 'rgba(255, 255, 255, 1)'
            : 'rgba(255, 255, 255, 0.25)'};
        box-shadow: ${props => props.$primary
            ? '0 12px 32px rgba(0, 0, 0, 0.2)'
            : '0 8px 24px rgba(0, 0, 0, 0.15)'};
        border-color: ${props => props.$primary
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(255, 255, 255, 0.5)'};
    }

    &:active {
        transform: translateY(0) scale(0.98);
    }

    &:focus-visible {
        outline: 3px solid rgba(255, 255, 255, 0.6);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        padding: 1rem 1.5rem;
        font-size: 1rem;
        border-radius: 14px;

        /* Improve mobile tap target size */
        min-height: 52px;
    }
`;

const FeaturesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
        padding: 1.25rem;
        gap: 0.625rem;
    }
`;

const FeatureItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    svg {
        flex-shrink: 0;
        opacity: 0.9;
    }

    @media (max-width: 768px) {
        font-size: 0.875rem;
        gap: 0.625rem;
    }
`;
