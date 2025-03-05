import { useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled from "styled-components";

const CreatePetButton = () => {
    const { setUser } = useContext(UserContext);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        birthdate: "",
        sex: "Male",
        spayed_neutered: false,
        address: "",
        behavorial_notes: "",
        supplies_location: "",
        allergies: "",
        active: true,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch("/pets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const newPet = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                pets: [...prevUser.pets, newPet],
            }));
            setShowForm(false);
            alert("Pet successfully added!");
        } else {
            alert("Error adding pet. Please try again.");
        }
    };

    return (
        <Container>
            {!showForm ? (
                <AddButton onClick={() => setShowForm(true)}>+ Add New Pet</AddButton>
            ) : (
                <FormContainer>
                    <h2>New Pet Form</h2>
                    <Form onSubmit={handleSubmit}>
                        <Label>Name</Label>
                        <Input name="name" value={formData.name} onChange={handleChange} required />

                        <Label>Birthdate</Label>
                        <Input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required />

                        <Label>Sex</Label>
                        <Select name="sex" value={formData.sex} onChange={handleChange}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </Select>

                        <Label>Spayed/Neutered</Label>
                        <Select name="spayed_neutered" value={formData.spayed_neutered} onChange={(e) => setFormData({ ...formData, spayed_neutered: e.target.value === 'true' })}>
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </Select>

                        <Label>Address</Label>
                        <Input name="address" value={formData.address} onChange={handleChange} />

                        <Label>Behavioral Notes</Label>
                        <Textarea name="behavorial_notes" value={formData.behavorial_notes} onChange={handleChange} />

                        <Label>Supplies Location</Label>
                        <Textarea name="supplies_location" value={formData.supplies_location} onChange={handleChange} />

                        <Label>Allergies</Label>
                        <Input name="allergies" value={formData.allergies} onChange={handleChange} />

                        <ButtonContainer>
                            <SubmitButton type="submit">Submit</SubmitButton>
                            <CancelButton type="button" onClick={() => setShowForm(false)}>Cancel</CancelButton>
                        </ButtonContainer>
                    </Form>
                </FormContainer>
            )}
        </Container>
    );
};

export default CreatePetButton;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const AddButton = styled.button`
    background-color: #007bff;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    transition: all 0.3s;
    &:hover {
        background-color: #0056b3;
        transform: scale(1.05);
    }
`;

const FormContainer = styled.div`
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
    width: 340px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Label = styled.label`
    margin-top: 12px;
    font-weight: 600;
    color: #333;
`;

const Input = styled.input`
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
`;

const Textarea = styled.textarea`
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    height: 80px;
    resize: vertical;
    font-size: 16px;
`;

const Select = styled.select`
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
`;

const SubmitButton = styled.button`
    background-color: #28a745;
    color: white;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
    &:hover {
        background-color: #218838;
        transform: scale(1.05);
    }
`;

const CancelButton = styled.button`
    background-color: #dc3545;
    color: white;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
    &:hover {
        background-color: #c82333;
        transform: scale(1.05);
    }
`;
