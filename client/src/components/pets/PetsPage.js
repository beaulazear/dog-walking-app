import React, { useState, useContext } from "react";
import styled from "styled-components";
import { PetsContext } from "../../context/pets";
import NewPetForm from "./NewPetForm";
import PetCard from "./PetCard";

// Styled Components
const Container = styled.div`
    background: #f8f9fa;
    padding: 20px;
`;

const Title = styled.h2`
    font-size: 2rem;
    color: #343a40;
    margin-bottom: 10px;
    text-align: center;

    @media (max-width: 768px) {
        text-align: center;
    }
`;

const Description = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
    margin: 20px auto;
    max-width: 350px; /* Smaller max-width similar to PetStats */
    font-size: 1.125rem;
    color: #495057;
    text-align: center;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const NewPetButton = styled.button`
    background-color: #e91e63;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 32px;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    margin-bottom: 15px;
    display: block;
    width: 350px;

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
    max-width: 600px;
    margin: 20px auto;
`;

const CardHeader = styled.h5`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const CardBody = styled.div`
    margin-top: 10px;
`;

const CardTitle = styled.h6`
    font-size: 1.25rem;
    color: #495057;
    margin: 10px 0;
`;

const CardText = styled.p`
    color: #6c757d;
`;

const FilterWrapper = styled.div`
    margin-bottom: 20px;
    text-align: center; /* Center the text and controls */
`;

const FilterTitle = styled.h3`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const FilterSelect = styled.select`
    padding: 12px;
    font-size: 1.1rem;
    border-radius: 5px;
    border: 1px solid #ddd;
    background-color: white;
    color: #343a40;
    margin-top: 8px;
    display: block;
    margin-left: auto;
    margin-right: auto;
`;

const PetStats = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 20px auto;
    max-width: 350px; /* Match the smaller max-width */
    text-align: left;
`;

const PetStatsTitle = styled.h3`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const PetStatsText = styled.p`
    font-size: 1.1rem;
    color: #495057;
    margin: 5px 0;
`;

export default function PetsPage() {
    const { pets, setPets } = useContext(PetsContext);
    const [filter, setFilter] = useState("active");
    const [displayFormButton, setDisplayFormButton] = useState(false);

    function sortObjectsByName(objects) {
        return objects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    }

    function updateDisplayButton() {
        setDisplayFormButton(!displayFormButton);
    }

    function addNewPet(newPet) {
        const newPets = [...pets, newPet];
        const sortedPets = sortObjectsByName(newPets);
        setPets(sortedPets);
        setDisplayFormButton(false);
    }

    function updateUserPets(updatedPet) {
        const updatedPets = pets.map(pet => (pet.id === updatedPet.id ? updatedPet : pet));
        setPets(updatedPets);
    }

    function updatePetsAfterDelete(deletedPet) {
        const remainingPets = pets.filter(pet => pet.id !== deletedPet.id);
        setPets(remainingPets);
    }

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
            <Title>Pets & Appointments</Title>
            <PetStats>
                <PetStatsTitle>Pet Statistics</PetStatsTitle>
                <PetStatsText><strong>Total Pets:</strong> {totalPetsCount}</PetStatsText>
                <PetStatsText><strong>Active Pets:</strong> {activePetsCount}</PetStatsText>
                <PetStatsText><strong>Inactive Pets:</strong> {inactivePetsCount}</PetStatsText>
            </PetStats>
            <ButtonWrapper>
                <NewPetButton onClick={updateDisplayButton}>Add New Pet</NewPetButton>
            </ButtonWrapper>
            <Description>
                Manage your pets here. Each pet can be updated and marked active or inactive. Use the filter to view pets based on their status.
                Create new appointments and invoices by clicking on a pet's accordion.
            </Description>
            {displayFormButton && pets && (
                <NewPetForm updateUserPets={addNewPet} />
            )}
            <FilterWrapper>
                <FilterTitle>Filter Pets</FilterTitle>
                <FilterSelect value={filter} onChange={handleFilterChange}>
                    <option value="active">Active Pets</option>
                    <option value="inactive">Inactive Pets</option>
                    <option value="both">Active & Inactive</option>
                </FilterSelect>
            </FilterWrapper>
            {pets === null ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {filteredPets.length > 0 ? (
                        filteredPets.map(pet => (
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                updatePetsAfterDelete={updatePetsAfterDelete}
                                updateUserPets={updateUserPets}
                            />
                        ))
                    ) : (
                        <NoPetsCard>
                            <CardHeader>No pets currently in database</CardHeader>
                            <CardBody>
                                <CardTitle>Click "New Pet" button to create a pet</CardTitle>
                                <CardText>
                                    Once a pet has been created, you can schedule appointments for said pet.
                                </CardText>
                            </CardBody>
                        </NoPetsCard>
                    )}
                </div>
            )}
        </Container>
    );
}
