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
        <div>
            <Container fluid="md" style={{ marginBottom: '35px' }}>
                <Row style={{ marginBottom: '16px' }}>
                    <Col>
                        <h2 className="display-4 m-3">Pets</h2>
                    </Col>
                    <Col className="text-right">
                        <Button className="m-3" variant="primary" onClick={updateDisplayButton}>New Pet</Button>
                    </Col>
                </Row>
                {displayFormButton && pets && (
                    <NewPetForm updateUserPets={addNewPet} />
                )}
                {pets === null ? (
                    <div>
                        Loading...
                    </div>
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
                    </div>
                )}
            </Container>
        </div>
    );
}
