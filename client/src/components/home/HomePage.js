import React from "react";
import styled from "styled-components";
import { Card } from 'react-bootstrap';

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
    min-height: 100vh;
`;

const Title = styled.h1`
    font-size: 2.5rem;
    margin-bottom: 20px;
    color: #343a40;
`;

const SubTitle = styled.h2`
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: #495057;
    text-align: center;
`;

const CustomCard = styled(Card)`
    width: 100%;
    max-width: 500px;
    margin: 10px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;

    &:hover {
        transform: scale(1.02);
    }

    .card-header {
        background-color: #007bff;
        color: white;
        font-size: 1.25rem;
        border-radius: 10px 10px 0 0;
    }

    .card-body {
        background-color: #ffffff;
    }
`;

const CardTitle = styled(Card.Title)`
    font-size: 1.25rem;
    color: #007bff;
`;

const CardText = styled(Card.Text)`
    color: #6c757d;
`;

export default function HomePage() {
    return (
        <Container>
            <Title>🐶 Welcome 🐈</Title>
            <SubTitle>Login or Signup to gain access:</SubTitle>
            <CustomCard>
                <Card.Header as="h5">Current Pets</Card.Header>
                <Card.Body>
                    <CardTitle>Your Own Pet Database</CardTitle>
                    <CardText>
                        Visit the "Pets" page to create, view, edit, & delete pets.
                    </CardText>
                </Card.Body>
            </CustomCard>
            <CustomCard>
                <Card.Header as="h5">Appointment Scheduling</Card.Header>
                <Card.Body>
                    <CardTitle>Keep track of your pet care appointments</CardTitle>
                    <CardText>
                        Add, edit, and delete appointments for pets in your database. Go to the "Today" page to view appointments scheduled for today and mark them as completed as you go. Invoices are created upon completion of appointment.
                    </CardText>
                </Card.Body>
            </CustomCard>
            <CustomCard>
                <Card.Header as="h5">Finances</Card.Header>
                <Card.Body>
                    <CardTitle>Personal finance for all pets</CardTitle>
                    <CardText>
                        Visit the "Finance" page to view current invoices (unpaid), and past invoices (paid) for each pet in your database. Here you can add additional incomes/past payments & view yearly income totals.
                    </CardText>
                </Card.Body>
            </CustomCard>
        </Container>
    );
}
