import React from "react";
import styled from "styled-components";

export default function Home() {
    return (
        <Container>
            <Title>Pocket Walks</Title>
            <SubTitle>Manage your pet care appointments, invoices, and more in one place.</SubTitle>
            <CardsContainer>
                <Card>
                    <CardTitle>📋 Pet Management</CardTitle>
                    <CardText>
                        Keep track of your pet clients. Add, edit, and manage pet details effortlessly.
                    </CardText>
                </Card>
                <Card>
                    <CardTitle>📅 Schedule Walks</CardTitle>
                    <CardText>
                        Schedule, modify, and track your daily pet care appointments.
                    </CardText>
                </Card>
                <Card>
                    <CardTitle>💰 Manage Finances</CardTitle>
                    <CardText>
                        Track invoices, payments, and calculate income directly in the app.
                    </CardText>
                </Card>
            </CardsContainer>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    padding: 60px 20px;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
`;

const Title = styled.h1`
    font-size: 3rem;
    font-weight: bold;
    color: white;
    margin-bottom: 15px;
`;

const SubTitle = styled.h2`
    font-size: 1.5rem;
    color: #f5f5f5;
    max-width: 600px;
    margin-bottom: 30px;
`;

const CardsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    max-width: 900px;
`;

const Card = styled.div`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    transition: transform 0.3s ease-in-out;

    &:hover {
        transform: scale(1.05);
    }
`;

const CardTitle = styled.h3`
    font-size: 1.5rem;
    color: white;
    margin-bottom: 10px;
`;

const CardText = styled.p`
    color: #f5f5f5;
    font-size: 1rem;
`;