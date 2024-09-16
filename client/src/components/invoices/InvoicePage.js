import React, { useState, useContext } from "react";
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

const FilterSection = styled.div`
    margin-bottom: 20px;
    text-align: left; // Align the section to the left on larger screens
    display: flex;
    flex-direction: column;
    align-items: left;

    @media (min-width: 769px) {
        text-align: left;
        align-items: flex-start; // Align the filter and title to the left on larger screens
    }
`;


const FilterTitle = styled.h3`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const FilterWrapper = styled.div`
    justify-content: flex-start; // Align the filter to the left

    @media (min-width: 769px) {
        justify-content: flex-start; // Maintain left alignment on larger screens
    }
`;

const FilterSelect = styled.select`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ced4da;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
        margin: 0 auto;
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

    if (filteredPets?.length > 0) {
        return (
            <Container>
                <Header>Finances</Header>
                <FinancePage />
                <FilterSection>
                    <FilterTitle>Filter Pets</FilterTitle>
                    <FilterWrapper>
                        <FilterSelect value={filter} onChange={handleFilterChange}>
                            <option value="active">Active Pets</option>
                            <option value="inactive">Inactive Pets</option>
                            <option value="both">Both Active and Inactive</option>
                        </FilterSelect>
                    </FilterWrapper>
                </FilterSection>
                {filteredPets.map((pet) => (
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
