import React, { useState, useContext } from "react";
import { PetsContext } from "../../context/pets";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button";
import Card from 'react-bootstrap/Card';
import NewPetForm from "./NewPetForm";
import PetCard from "./PetCard";

export default function PetsPage() {

    const { pets, setPets } = useContext(PetsContext);

    const [displayFormButton, setDisplayFormButton] = useState(false);

    function sortObjectsByName(objects) {
        return objects.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
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

    function updateUserPets(newPet) {
        const newPets = pets.map((pet) => {
            if (pet.id === newPet.id) {
                return newPet;
            } else {
                return pet;
            }
        });
        setPets(newPets);
    }

    function updatePetsAfterDelete(oldPet) {
        const newPets = pets.filter((pet) => pet.id !== oldPet.id);
        setPets(newPets);
    }

    return (
        <Container fluid="md" style={{ marginBottom: '35px' }}>
            <Row style={{ marginBottom: '16px' }}>
                <Col>
                    <h2 className="display-4 m-3">Pets</h2>
                </Col>
                <Col className="text-right">
                    <Button className="m-3" variant="primary" onClick={updateDisplayButton}>New Pet</Button>
                </Col>
            </Row>
            {displayFormButton && <NewPetForm updateUserPets={addNewPet} />}
            {pets.length > 0 ? (
                pets.map((pet) => (
                    <PetCard
                        updatePetsAfterDelete={updatePetsAfterDelete}
                        updateUserPets={updateUserPets}
                        key={pet.id}
                        pet={pet}
                    />
                ))
            ) : (
                <Card className="m-2">
                    <Card.Header as="h5">No pets currently in database</Card.Header>
                    <Card.Body>
                        <Card.Title>Click "New Pet" button to create a pet</Card.Title>
                        <Card.Text>
                            Once a pet has been created, you can schedule appointments for said pet.
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
