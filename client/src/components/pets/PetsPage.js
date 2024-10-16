import React, { useState, useContext } from "react";
import styled from "styled-components";
import { PetsContext } from "../../context/pets";
import NewPetForm from "./NewPetForm";
import PetCard from "./PetCard";

const Container = styled.div`
    background: #f8f9fa;
    padding: 10px;
    margin: 0; /* Adjusted margin to match InvoicesPage */
    max-width: 100%; /* Consistent with InvoicesPage */
`;

const Title = styled.h2`
    font-size: 2em;
    color: #343a40;
    margin: 0; /* Remove default margin */
    text-align: center;

    @media (max-width: 768px) {
        font-size: 1.75em;
    }
`;

const Description = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
    margin: 10px auto;
    max-width: 600px;
    font-size: 1.125rem;
    color: #495057;
    text-align: left;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const NewPetButton = styled.button`
    background-color: #e91e63;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 6px 18px;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    display: block;
    width: 45%;

    &:hover {
        background-color: #c2185b;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    @media (max-width: 768px) {
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
`;

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const NoPetsCard = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 10px auto;
    max-width: 600px;
`;

const FilterWrapper = styled.div`
    margin-bottom: 20px;
    text-align: center;
`;

const FilterTitle = styled.h3`
    font-size: 1.8rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const FilterSelect = styled.select`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ced4da;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 0 auto;
    display: block;
    width: 100%;
    max-width: 600px;

    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

const PetStats = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 15px auto;
    max-width: 600px;
    text-align: left;
`;

const PetStatsTitle = styled.h3`
    font-size: 1.8rem; /* Match financial overview font size */
    color: #343a40; /* Same dark color as Finance Page title */
    text-align: center;
    margin-bottom: 20px; /* Add more space to the bottom */
`;

const PetStatsText = styled.p`
    font-size: 1.25rem; /* Similar font size to finance overview details */
    color: #495057;
    margin: 10px 0;
    font-weight: bold; /* Add a bold weight for emphasis */
`;

export default function PetsPage() {
    const { pets, setPets } = useContext(PetsContext);
    const [filter, setFilter] = useState("active");
    const [displayFormButton, setDisplayFormButton] = useState(false);

    function handleFilterChange(e) {
        setFilter(e.target.value);
    }

    const filteredPets = pets.filter(pet => {
        if (filter === "active") return pet.active;
        if (filter === "inactive") return !pet.active;
        return true;
    });

    const activePetsCount = pets.filter(pet => pet.active).length;
    const inactivePetsCount = pets.filter(pet => !pet.active).length;
    const totalPetsCount = pets.length;

    return (
        <Container>
            <Title>Pets Page</Title>
            <Description>
                Manage your pets here. Each pet can be updated and marked active or inactive. Use the filter to view pets based on their status.
                Create new appointments and invoices by clicking on a pet's accordion.
            </Description>
            <PetStats>
                <PetStatsTitle>Your Pet Statistics</PetStatsTitle>
                <ButtonWrapper>
                    <NewPetButton onClick={() => setDisplayFormButton(!displayFormButton)}>
                        {displayFormButton ? "Close New Pet Form" : "Add New Pet To Database"}
                    </NewPetButton>
                </ButtonWrapper>
                <PetStatsText><strong>Total Pets:</strong> {totalPetsCount}</PetStatsText>
                <PetStatsText><strong>Marked As Active:</strong> {activePetsCount}</PetStatsText>
                <PetStatsText><strong>Marked As Inactive:</strong> {inactivePetsCount}</PetStatsText>
            </PetStats>
            {displayFormButton && pets && (
                <NewPetForm updateUserPets={setPets} />
            )}
            <FilterWrapper>
                <FilterTitle>Filter Active & Inactive Pets</FilterTitle>
                <FilterSelect value={filter} onChange={handleFilterChange}>
                    <option value="active">Active Pets</option>
                    <option value="inactive">Inactive Pets</option>
                    <option value="both">Active and Inactive</option>
                </FilterSelect>
            </FilterWrapper>
            {filteredPets.length > 0 ? (
                filteredPets.map(pet => (
                    <PetCard key={pet.id} pet={pet} />
                ))
            ) : (
                <NoPetsCard>
                    <h5>No pets available</h5>
                    <p>Create your first pet to get started.</p>
                </NoPetsCard>
            )}
        </Container>
    );
}
