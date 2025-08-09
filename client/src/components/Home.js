import React from "react";
import styled, { keyframes } from "styled-components";
import { Link } from "react-router-dom";
import { Heart, LogIn, UserPlus } from "lucide-react";
import dogImage from "../assets/dog.png";

export default function Home() {
    return (
        <Container>
            <FloatingPaws delay="0s" startX="10%" />
            <FloatingPaws delay="2s" startX="30%" />
            <FloatingPaws delay="4s" startX="50%" />
            <FloatingPaws delay="6s" startX="70%" />
            <FloatingPaws delay="8s" startX="90%" />
            <FloatingPaws delay="1s" startX="20%" />
            <FloatingPaws delay="3s" startX="40%" />
            <FloatingPaws delay="5s" startX="60%" />
            <FloatingPaws delay="7s" startX="80%" />
            
            <ContentContainer>
                <HeroSection>
                    <DogImageWrapper>
                        <DogImage src={dogImage} alt="Pocket Walks Mascot" />
                    </DogImageWrapper>
                    
                    <Title>
                        <Heart size={40} fill="#ff6b9d" />
                        Pocket Walks
                    </Title>
                    
                    <SubTitle>
                        Animal care done differently
                    </SubTitle>
                    
                    <ButtonContainer>
                        <LoginButton to="/login">
                            <LogIn size={20} />
                            <span>Login</span>
                        </LoginButton>
                        
                        <SignUpButton to="/signup">
                            <UserPlus size={20} />
                            <span>Sign Up</span>
                        </SignUpButton>
                    </ButtonContainer>
                </HeroSection>
                
                <FeatureGrid>
                    <FeatureCard>
                        <FeatureEmoji>🚀</FeatureEmoji>
                        <FeatureText>Fast & Simple</FeatureText>
                    </FeatureCard>
                    <FeatureCard>
                        <FeatureEmoji>💰</FeatureEmoji>
                        <FeatureText>Track Payments</FeatureText>
                    </FeatureCard>
                    <FeatureCard>
                        <FeatureEmoji>📅</FeatureEmoji>
                        <FeatureText>Schedule Walks</FeatureText>
                    </FeatureCard>
                </FeatureGrid>
            </ContentContainer>
        </Container>
    );
}

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
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  75% { transform: translateY(5px) rotate(5deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const pawFloat = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  5% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.2;
    transform: translateY(50vh) rotate(180deg) scale(1);
  }
  95% {
    opacity: 0.15;
  }
  100% {
    transform: translateY(-50px) rotate(360deg) scale(0.8);
    opacity: 0;
  }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const Container = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
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
        animation: ${float} 30s linear infinite;
        pointer-events: none;
    }
`;

const FloatingPaws = styled.div`
    position: absolute;
    font-size: 1.5rem;
    animation: ${pawFloat} 20s linear infinite;
    animation-delay: ${props => props.delay || '0s'};
    pointer-events: none;
    opacity: 0.15;
    left: ${props => props.startX || '0%'};
    
    &::before {
        content: '🐾';
        filter: grayscale(20%) brightness(1.2);
    }
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    z-index: 1;
    animation: ${fadeIn} 0.8s ease-out;
    max-width: 500px;
    width: 100%;
    text-align: center;
`;

const HeroSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
`;

const DogImageWrapper = styled.div`
    position: relative;
`;

const DogImage = styled.img`
    width: 100px;
    height: auto;
    filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
    
    &:hover {
        transform: scale(1.05);
    }
`;

const Title = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 2.75rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 2.25rem;
        gap: 0.5rem;
    }
    
    @media (max-width: 480px) {
        font-size: 1.875rem;
        gap: 0.5rem;
        
        svg {
            width: 30px;
            height: 30px;
        }
    }
`;

const SubTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.125rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 1rem;
    }
    
    @media (max-width: 480px) {
        font-size: 0.9rem;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 1rem;
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }
`;

const LoginButton = styled(Link)`
    background: rgba(255, 255, 255, 0.95);
    color: #4c51bf;
    padding: 1rem 2rem;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transition: left 0.5s ease;
    }
    
    &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.6);
        
        &::before {
            left: 100%;
        }
    }
    
    &:active {
        transform: translateY(0) scale(0.98);
    }
    
    @media (max-width: 480px) {
        padding: 0.875rem 1.5rem;
    }
`;

const SignUpButton = styled(Link)`
    background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
    color: white;
    padding: 1rem 2rem;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    border: 2px solid transparent;
    border-radius: 16px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    box-shadow: 0 8px 25px rgba(76, 81, 191, 0.3);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
    }
    
    &:hover {
        background: linear-gradient(135deg, #553c9a 0%, #44337a 100%);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 35px rgba(76, 81, 191, 0.4);
        
        &::before {
            left: 100%;
        }
    }
    
    &:active {
        transform: translateY(0) scale(0.98);
    }
    
    @media (max-width: 480px) {
        padding: 0.875rem 1.5rem;
    }
`;

const FeatureGrid = styled.div`
    display: flex;
    justify-content: center;
    gap: 2rem;
    width: 100%;
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }
`;

const FeatureCard = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
    }
    
    @media (max-width: 480px) {
        width: 200px;
        justify-content: center;
    }
`;

const FeatureEmoji = styled.div`
    font-size: 1.25rem;
    line-height: 1;
`;

const FeatureText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

