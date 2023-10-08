import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function UpdatPetForm({ pet }) {

    const [name, setName] = useState(pet.name)
    const [address, setAddress] = useState(pet.address)
    const [sex, setSex] = useState(pet.sex)
    const [birthdate, setBirthdate] = useState(pet.birthdate)
    const [allergies, setAllergies] = useState(pet.allergies)
    const [suppliesLocation, setSuppliesLocation] = useState(pet.supplies_location)
    const [behavorialNotes, setbehavorialNotes] = useState(pet.behavorial_notes)
    const [spayedOrNeutered, setSpayedOrNeutered] = useState(pet.spayed_neutered)

    const [errors, setErrors] = useState([])

    function handleSignup(e) {

        e.preventDefault()
        fetch(`/pets/${pet.id}`, {
            method: "PATCH",
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
                    response.json().then((data) => {
                        console.log(data)
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
            <h1 classsex="display-3">Update "{pet.name}"</h1>
            <Form className="text-bg-light p-3" onSubmit={handleSignup}>
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
                    <Form.Select onChange={(updateSex)} aria-label="Default select example" value={sex.toLowerCase()}>
                        <option>Open this select menu</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group classsex="mb-3">
                    <Form.Label>Spayed or Neutered?</Form.Label>
                    <Form.Select onChange={(updateSpayedOrNeutered)} aria-label="Default select example" value={spayedOrNeutered} >
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
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </Container>
    )
}