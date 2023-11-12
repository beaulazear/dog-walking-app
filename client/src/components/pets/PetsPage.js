import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button"
import Card from 'react-bootstrap/Card';
import NewPetForm from "./NewPetForm";
import PetCard from "./PetCard";

export default function PetsPage() {

    const [displayFormButton, setDisplayFormButton] = useState(false)

    const [pets, setPets] = useState([])

    useEffect(() => {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    setPets(pets)
                });
            }
        });
    }, []);

    function updateDisplayButton() {
        setDisplayFormButton(!displayFormButton)
    }

    function addNewPet(newPet) {
        setPets([...pets, newPet])
        setDisplayFormButton(false)
    }

    function updateUserPets(newPet) {
        const newPets = pets.filter((pet) => pet.id !== newPet.id)
        setPets([newPet, ...newPets])
    }

    function updatePetsAfterDelete(oldPet) {
        const newPets = pets.filter((pet) => pet.id !== oldPet.id)
        setPets(newPets)
    }

    if (pets.length > 0) {
        return (
            <Container>
                <Row>
                    <Col>
                        <h2 className="display-4 m-3">Pets</h2>
                    </Col>
                    <Col>
                        <Button className="m-3" variant="primary" onClick={updateDisplayButton}>New Pet</Button>
                    </Col>
                </Row>
                {displayFormButton === true && (
                    <NewPetForm updateUserPets={addNewPet} />
                )}
                {pets.map((pet) => (
                    <PetCard updatePetsAfterDelete={updatePetsAfterDelete} updateUserPets={updateUserPets} key={pet.id} pet={pet} />
                ))}
            </Container>
        )
    } else {
        return (
            <Container className="m-3">
                <Row>
                    <Col>
                        <h2 className="display-4">Pets</h2>
                    </Col>
                    <Col>
                        <Button className="m-1" variant="primary" onClick={updateDisplayButton}>New Pet</Button>
                    </Col>
                </Row>
                {displayFormButton === true && (
                    <NewPetForm updateUserPets={addNewPet} />
                )}
                <Card className="m-2">
                    <Card.Header as="h5">No pets currently in database</Card.Header>
                    <Card.Body>
                        <Card.Title>Click "New Pet" button to create a pet</Card.Title>
                        <Card.Text>
                            Once a pet has been created, you can schedule appointments for said pet.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Container>
        )
    }
}