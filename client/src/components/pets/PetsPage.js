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
    text-align: left;

    @media (max-width: 768px) {
        text-align: center;
    }
`;

const NewPetButton = styled.button`
    background-color: #e91e63;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 10px 30px;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    margin: 20px 0;
    display: block;


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
    
    @media (min-width: 769px) {
        justify-content: flex-start;
    }
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

export default function PetsPage() {
    const { pets, setPets } = useContext(PetsContext);
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

    return (
        <Container>
            <Title>Pets & Appointments</Title>
            <ButtonWrapper>
                <NewPetButton onClick={updateDisplayButton}>New Pet</NewPetButton>
            </ButtonWrapper>
            {displayFormButton && pets && (
                <NewPetForm updateUserPets={addNewPet} />
            )}
            {pets === null ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {pets.length > 0 ? (
                        pets.map(pet => (
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
