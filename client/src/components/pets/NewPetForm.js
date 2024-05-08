import React, { useState } from "react";
import styled from "styled-components";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

const StyledFormContainer = styled(Container)`
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const StyledTitle = styled.h1`
    font-size: 2em;
    color: #333;
    margin-bottom: 20px;
`;

const StyledFormGroup = styled(Form.Group)`
    margin-bottom: 20px;
`;

const StyledLabel = styled(Form.Label)`
    font-weight: bold;
`;

const StyledButton = styled(Button)`
    background-color: #007bff;
    border-color: #007bff;
    &:hover {
        background-color: #0056b3;
        border-color: #0056b3;
    }
`;

export default function NewPetForm({ updateUserPets }) {

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [sex, setSex] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [allergies, setAllergies] = useState("");
    const [suppliesLocation, setSuppliesLocation] = useState("");
    const [behavioralNotes, setBehavioralNotes] = useState("");
    const [spayedOrNeutered, setSpayedOrNeutered] = useState(false);

    const [errors, setErrors] = useState([]);

    function handleNewPet(e) {
        e.preventDefault();
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
                behavioral_notes: behavioralNotes,
                supplies_location: suppliesLocation,
                spayed_neutered: spayedOrNeutered
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((newPet) => {
                        updateUserPets(newPet);
                    });
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors));
                }
            });
    }

    function updateSpayedOrNeutered(e) {
        setSpayedOrNeutered(e.target.value === "true");
    }

    function updateSex(e) {
        setSex(e.target.value);
    }

    return (
        <StyledFormContainer>
            <StyledTitle>New Pet Form</StyledTitle>
            <Form onSubmit={handleNewPet}>
                <StyledFormGroup>
                    <StyledLabel>Pet's Name</StyledLabel>
                    <Form.Control onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Enter name" />
                </StyledFormGroup>
                <StyledFormGroup controlId="formBasicAddress">
                    <StyledLabel>Address</StyledLabel>
                    <Form.Control onChange={(e) => setAddress(e.target.value)} value={address} type="text" placeholder="Enter address" />
                    <Form.Text className="text-muted">
                        Please enter the address of the pet. Make sure to specify an apartment number if there is one.
                    </Form.Text>
                </StyledFormGroup>
                <StyledFormGroup>
                    <StyledLabel>Sex</StyledLabel>
                    <Form.Select onChange={updateSex} aria-label="Select sex">
                        <option>Select sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </Form.Select>
                </StyledFormGroup>
                <StyledFormGroup>
                    <StyledLabel>Spayed or Neutered?</StyledLabel>
                    <Form.Select onChange={updateSpayedOrNeutered} aria-label="Select spayed or neutered">
                        <option>Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </Form.Select>
                </StyledFormGroup>
                <StyledFormGroup controlId="formBasicBirthdate">
                    <StyledLabel>Birthdate:</StyledLabel>
                    <Form.Control value={birthdate} onChange={(e) => setBirthdate(e.target.value)} type="date" />
                </StyledFormGroup>
                <StyledFormGroup controlId="formBasicAllergies">
                    <StyledLabel>Allergies</StyledLabel>
                    <Form.Control onChange={(e) => setAllergies(e.target.value)} value={allergies} type="text" placeholder="Does your dog have any known allergies? If not, please type none" />
                </StyledFormGroup>
                <StyledFormGroup controlId="formBasicSuppliesLocation">
                    <StyledLabel>Supplies Location</StyledLabel>
                    <Form.Control onChange={(e) => setSuppliesLocation(e.target.value)} value={suppliesLocation} type="text" placeholder="Leash location, treats, etc..." />
                </StyledFormGroup>
                <StyledFormGroup controlId="formBasicBehavioralNotes">
                    <StyledLabel>Behavioral / Additional Information</StyledLabel>
                    <Form.Control onChange={(e) => setBehavioralNotes(e.target.value)} value={behavioralNotes} type="text" placeholder="Leash reactivity, tries to eat trash, etc..." />
                </StyledFormGroup>
                {errors?.length > 0 && (
                    <ul>
                        {errors.map((error, index) => (
                            <Alert key={index} variant="danger">
                                {error}
                            </Alert>
                        ))}
                    </ul>
                )}
                <StyledButton variant="primary" type="submit">
                    Submit
                </StyledButton>
            </Form>
        </StyledFormContainer>
    );
}
