import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function NewPetForm({ updateUserPets }) {

    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [sex, setSex] = useState("")
    const [birthdate, setBirthdate] = useState("")
    const [allergies, setAllergies] = useState("")
    const [suppliesLocation, setSuppliesLocation] = useState("")
    const [behavorialNotes, setbehavorialNotes] = useState("")
    const [spayedOrNeutered, setSpayedOrNeutered] = useState(false)

    const [errors, setErrors] = useState([])

    function handleNewPet(e) {

        e.preventDefault()
        fetch("/pets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                sex: sex,
                address: address,
                birthdate: birthdate,
                allergies: allergies,
                behavorial_notes: behavorialNotes,
                supplies_location: suppliesLocation,
                spayed_neutered: spayedOrNeutered
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((newPet) => {
                        updateUserPets(newPet)
                    })
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors))
                }
            })
    }

    function updateSpayedOrNeutered(e) {
        if (e.target.value === "true") {
            setSpayedOrNeutered(true)
        } else {
            setSpayedOrNeutered(false)
        }
    }

    function updateSex(e) {
        if (e.target.value === "Male") {
            setSex("Male")
        } else {
            setSex("Female")
        }
    }


    return (
        <Container>
            <h1 className="display-6">New Pet Form</h1>
            <Form className="text-bg-light" onSubmit={handleNewPet}>
                <Form.Group classsex="mb-3">
                    <Form.Label>Pet's Name</Form.Label>
                    <Form.Control onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Enter name" />
                </Form.Group>
                <Form.Group classsex="mb-3" controlId="formBasicaddress">
                    <Form.Label>Address</Form.Label>
                    <Form.Control onChange={(e) => setAddress(e.target.value)} value={address} type="text" placeholder="Enter address" />
                    <Form.Text classsex="text-muted">
                        Please enter the address of the pet. Make sure to specify an apartment number if there is one.
                    </Form.Text>
                </Form.Group>
                <Form.Group classsex="mb-3">
                    <Form.Label>Sex</Form.Label>
                    <Form.Select onChange={(updateSex)} aria-label="Default select example">
                        <option>Open this select menu</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group classsex="mb-3">
                    <Form.Label>Spayed or Neutered?</Form.Label>
                    <Form.Select onChange={(updateSpayedOrNeutered)} aria-label="Default select example">
                        <option>Open this select menu</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group classsex="mb-3" controlId="formBasicbirthdate">
                    <Form.Label>Birthdate:</Form.Label>
                    <Form.Control value={birthdate} onChange={(e) => setBirthdate(e.target.value)} type="date">
                    </Form.Control>
                </Form.Group>
                <Form.Group classsex="mb-3" controlId="formBasicAllergies">
                    <Form.Label>Allergies</Form.Label>
                    <Form.Control onChange={(e) => setAllergies(e.target.value)} value={allergies} type="text" placeholder="Does your dog have any known allergies? If not, please type none" />
                </Form.Group>
                <Form.Group classsex="mb-3" controlId="formBasicSuppliesLocation">
                    <Form.Label>Supplies Location</Form.Label>
                    <Form.Control onChange={(e) => setSuppliesLocation(e.target.value)} value={suppliesLocation} type="text" placeholder="Leash location, treats, etc..." />
                </Form.Group>
                <Form.Group classsex="mb-3" controlId="formBasicBehaviorialNotes">
                    <Form.Label>Behaviorial Information</Form.Label>
                    <Form.Control onChange={(e) => setbehavorialNotes(e.target.value)} value={behavorialNotes} type="text" placeholder="Leash reactivity, tries to eat trash, etc..." />
                </Form.Group>
                {errors?.length > 0 && (
                    <ul>
                        {errors.map((error) => (
                            <Alert key={error} variant={'danger'}>
                                {error}
                            </Alert>))}
                    </ul>
                )}
                <br></br>
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
            <br></br>
        </Container>
    )
}