import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button"
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

    if (pets) {
        return (
            <Container className="m-3">
                <Row>
                    <Col>
                        <h2 className="display-4">Current Pets</h2>
                    </Col>
                    <Col>
                        <Button className="m-2" variant="primary" onClick={updateDisplayButton}>Create New Pet</Button>
                    </Col>
                </Row>
                <Container className="m-3">
                    {displayFormButton === true && (
                        <NewPetForm updateUserPets={addNewPet} />
                    )}
                </Container>
                <Container fluid="md">
                    {pets.map((pet) => (
                        <PetCard updatePetsAfterDelete={updatePetsAfterDelete} updateUserPets={updateUserPets} key={pet.id} pet={pet} />
                    ))}
                </Container>
            </Container>
        )
    } else {
        return (
            <div>...loading</div>
        )
    }
}