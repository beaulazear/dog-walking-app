import React, { useContext } from "react";
import styled from "styled-components";
import { PetsContext } from "../../context/pets";
import FinancePage from "../finances/FinancePage";
import InvoicePetCard from "./InvoicePetCard";

// Styled Components
const Container = styled.div`
    background: #f8f9fa;
    padding: 20px;
    margin: 0 10px;
`;

const Header = styled.h2`
    font-size: 2em;
    margin-left: 8px;
    color: #343a40;
    
        @media (max-width: 768px) {
        text-align: center;
    }
`;

const StyledCard = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin: 10px;
    padding: 20px;
`;

const CardHeader = styled.h5`
    font-size: 1.5rem;
    color: #343a40;
`;

const CardBody = styled.div`
    margin-top: 1em;
`;

const CardTitle = styled.h6`
    font-size: 1.25rem;
    color: #495057;
    margin: 10px 0;
`;

const CardText = styled.p`
    color: #6c757d;
`;

export default function InvoicesPage() {
    const { pets } = useContext(PetsContext);

    if (pets?.length > 0) {
        return (
            <Container>
                <Header>Finances</Header>
                <FinancePage />
                {pets.map((pet) => (
                    <InvoicePetCard key={pet.id} pet={pet} />
                ))}
            </Container>
        );
    } else {
        return (
            <Container>
                <Header>Finances</Header>
                <StyledCard>
                    <CardHeader>No pets currently in database</CardHeader>
                    <CardBody>
                        <CardTitle>Visit the "Pets" page to create your first pet.</CardTitle>
                        <CardText>
                            Once a pet has been created, you can schedule appointments for said pet. Once an appointment is completed, an invoice will be created and displayed on this page.
                        </CardText>
                    </CardBody>
                </StyledCard>
            </Container>
        );
    }
}
