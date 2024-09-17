import React, { useState, useContext } from "react";
import styled from "styled-components";
import { PetsContext } from "../../context/pets";
import FinancePage from "../finances/FinancePage";
import InvoicePetCard from "./InvoicePetCard";

// Styled Components
const Container = styled.div`
    background: #f8f9fa;
    padding: 10px;
    margin: 0 10px;
`;

const Header = styled.h2`
    font-size: 2em;
    color: #343a40;
    margin: 0; // Remove any default margin
    text-align: center; // Centered text for all screen sizes

    @media (max-width: 768px) {
        font-size: 1.75em; // Optional: adjust font size for smaller screens if needed
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

const FilterSection = styled.div`
    margin-bottom: 20px;
    text-align: center; // Center the text and controls
`;

const FilterTitle = styled.h3`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const FilterSelect = styled.select`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ced4da;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 0 auto; // Center the select element
    display: block; // Ensure the select takes up the full width available

    @media (max-width: 768px) {
        font-size: 0.9rem; // Optional: adjust font size for smaller screens if needed
    }
`;

const Description = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
    margin: 20px auto;
    max-width: 350px; // Adjust to match the PetStats width
    font-size: 1.125rem;
    color: #495057;
    text-align: center;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

export default function InvoicesPage() {
    const { pets } = useContext(PetsContext);
    const [filter, setFilter] = useState("active");

    function handleFilterChange(e) {
        setFilter(e.target.value);
    }

    function filterPets(pets) {
        if (filter === "active") {
            return pets.filter(pet => pet.active);
        } else if (filter === "inactive") {
            return pets.filter(pet => !pet.active);
        }
        return pets;
    }

    const filteredPets = filterPets(pets);

    return (
        <Container>
            <FinancePage />
            <Description>
                Click on a pet to view their new invoices. You can mark invoices as pending or paid as they are sent to the client.
                Additionally, view all past invoice data and add incomes for payments that did not come from walk invoices.
            </Description>
            <FilterSection>
                <FilterTitle>Filter Pets</FilterTitle>
                <FilterSelect value={filter} onChange={handleFilterChange}>
                    <option value="active">Active Pets</option>
                    <option value="inactive">Inactive Pets</option>
                    <option value="both">Active and Inactive</option>
                </FilterSelect>
            </FilterSection>
            {filteredPets.length > 0 ? (
                filteredPets.map((pet) => (
                    <InvoicePetCard key={pet.id} pet={pet} />
                ))
            ) : (
                <StyledCard>
                    <CardHeader>No pets currently in database</CardHeader>
                    <CardBody>
                        <CardTitle>Visit the "Pets" page to create your first pet.</CardTitle>
                        <CardText>
                            Once a pet has been created, you can schedule appointments for them. After an appointment is completed,
                            an invoice will be generated and displayed here.
                        </CardText>
                    </CardBody>
                </StyledCard>
            )}
        </Container>
    );
}
