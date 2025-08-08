import React from "react";
import styled from "styled-components";
import { 
    Heart, 
    Calendar, 
    DollarSign, 
    Users, 
    Clock
} from "lucide-react";

export default function Home() {
    return (
        <Container>
            <HeaderSection>
                <TitleSection>
                    <Title>
                        <Heart size={40} />
                        Pocket Walks
                    </Title>
                    <SubTitle>
                        Manage your pet care appointments, invoices, and more in one beautiful place.
                    </SubTitle>
                </TitleSection>
            </HeaderSection>
            
            <CardsContainer>
                <Card>
                    <CardIcon>
                        <Users size={32} />
                    </CardIcon>
                    <CardTitle>Pet Management</CardTitle>
                    <CardText>
                        Keep track of your pet clients. Add, edit, and manage pet details effortlessly with our intuitive interface.
                    </CardText>
                </Card>
                
                <Card>
                    <CardIcon>
                        <Calendar size={32} />
                    </CardIcon>
                    <CardTitle>Schedule Walks</CardTitle>
                    <CardText>
                        Schedule, modify, and track your daily pet care appointments with our smart scheduling system.
                    </CardText>
                </Card>
                
                <Card>
                    <CardIcon>
                        <DollarSign size={32} />
                    </CardIcon>
                    <CardTitle>Manage Finances</CardTitle>
                    <CardText>
                        Track invoices, payments, and calculate income directly in the app with comprehensive reporting.
                    </CardText>
                </Card>
            </CardsContainer>
            
            <FeatureHighlight>
                <HighlightIcon>
                    <Clock size={28} />
                </HighlightIcon>
                <HighlightText>
                    Streamline your pet care business with modern tools designed for professionals
                </HighlightText>
            </FeatureHighlight>
        </Container>
    );
}

const Container = styled.div`
    background: linear-gradient(135deg, #ff6b9d, #c44569, #f8a5c2, #fdcb6e);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    min-height: 100vh;
    padding: 40px 20px;
    padding-top: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    @media (max-width: 768px) {
        padding: 20px 16px;
        padding-top: 100px;
    }
`;

const HeaderSection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 900px;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        margin-bottom: 32px;
    }
`;

const TitleSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Title = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 3.5rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    
    @media (max-width: 768px) {
        font-size: 2.8rem;
        gap: 12px;
    }
    
    @media (max-width: 480px) {
        font-size: 2.2rem;
        gap: 8px;
        
        svg {
            width: 32px;
            height: 32px;
        }
    }
`;

const SubTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.4rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    max-width: 700px;
    margin: 0 0 20px 0;
    line-height: 1.6;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
        max-width: 500px;
    }
    
    @media (max-width: 480px) {
        font-size: 1.1rem;
        max-width: 350px;
    }
`;

const CardsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
    max-width: 1000px;
    width: 100%;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 20px;
        margin-bottom: 32px;
    }
`;

const Card = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8));
    border-radius: 20px;
    border: 2px solid rgba(139, 90, 140, 0.4);
    backdrop-filter: blur(20px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    padding: 32px 28px;
    transition: all 0.4s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    
    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        border-color: #a569a7;
        background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.85));
    }
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #a569a7, #8b5a8c, #a569a7);
        opacity: 0.8;
    }
    
    @media (max-width: 768px) {
        padding: 28px 24px;
    }
    
    @media (max-width: 480px) {
        padding: 24px 20px;
    }
`;

const CardIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: rgba(165, 105, 167, 0.3);
    border-radius: 50%;
    margin-bottom: 20px;
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    
    .card:hover & {
        background: rgba(165, 105, 167, 0.5);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
    }
    
    @media (max-width: 480px) {
        width: 56px;
        height: 56px;
        margin-bottom: 16px;
        
        svg {
            width: 28px;
            height: 28px;
        }
    }
`;

const CardTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 480px) {
        font-size: 1.3rem;
        margin-bottom: 12px;
    }
`;

const CardText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
    line-height: 1.6;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 480px) {
        font-size: 0.95rem;
    }
`;

const FeatureHighlight = styled.div`
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1));
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 24px 32px;
    max-width: 600px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    text-align: left;
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.3);
    }
    
    @media (max-width: 768px) {
        padding: 20px 24px;
        text-align: center;
        flex-direction: column;
        gap: 12px;
    }
    
    @media (max-width: 480px) {
        padding: 18px 20px;
        gap: 10px;
    }
`;

const HighlightIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: #ffffff;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    @media (max-width: 480px) {
        width: 40px;
        height: 40px;
        
        svg {
            width: 22px;
            height: 22px;
        }
    }
`;

const HighlightText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.5;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 480px) {
        font-size: 1rem;
    }
`;