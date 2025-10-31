import { useState, useContext } from "react";
import { UserContext } from "../context/user.js";
import styled from "styled-components";
import { Plus, X } from "lucide-react";
import toast from 'react-hot-toast';

const CreatePetButton = () => {
    const { setUser } = useContext(UserContext);
    const [showForm, setShowForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        birthdate: "",
        sex: "Male",
        spayed_neutered: false,
        address: "",
        behavioral_notes: "",
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

        if (isCreating) return;

        setIsCreating(true);
        try {
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
                toast.success("Pet successfully added!");
            } else {
                const errorData = await response.json();
                toast.error(errorData.errors?.join(", ") || "Error adding pet. Please try again.");
            }
        } catch (error) {
            console.error("Error adding pet:", error);
            toast.error("An error occurred while adding the pet.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <AddButton onClick={() => setShowForm(true)}>
                <Plus size={20} />
                Add New Pet
            </AddButton>
            
            {showForm && (
                <Overlay onClick={() => setShowForm(false)}>
                    <ModalContainer onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>Add New Pet</ModalTitle>
                            <CloseButton onClick={() => setShowForm(false)}>
                                <X size={24} />
                            </CloseButton>
                        </ModalHeader>
                        
                        <Form onSubmit={handleSubmit}>
                            <InputGroup>
                                <Label>Pet Name *</Label>
                                <Input 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    placeholder="Enter pet's name"
                                    required 
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>Birthdate *</Label>
                                <Input 
                                    type="date" 
                                    name="birthdate" 
                                    value={formData.birthdate} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </InputGroup>

                            <TwoColumnGroup>
                                <InputGroup>
                                    <Label>Sex</Label>
                                    <Select name="sex" value={formData.sex} onChange={handleChange}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </Select>
                                </InputGroup>

                                <InputGroup>
                                    <Label>Spayed/Neutered</Label>
                                    <Select name="spayed_neutered" value={formData.spayed_neutered} onChange={(e) => setFormData({ ...formData, spayed_neutered: e.target.value === 'true' })}>
                                        <option value={true}>Yes</option>
                                        <option value={false}>No</option>
                                    </Select>
                                </InputGroup>
                            </TwoColumnGroup>

                            <InputGroup>
                                <Label>Address</Label>
                                <Input 
                                    name="address" 
                                    value={formData.address} 
                                    onChange={handleChange} 
                                    placeholder="Pet's primary address"
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>Behavioral Notes</Label>
                                <Textarea 
                                    name="behavioral_notes" 
                                    value={formData.behavioral_notes} 
                                    onChange={handleChange} 
                                    placeholder="Any behavioral notes or special instructions..."
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>Supplies Location</Label>
                                <Textarea 
                                    name="supplies_location" 
                                    value={formData.supplies_location} 
                                    onChange={handleChange} 
                                    placeholder="Where are leashes, treats, etc. located?"
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>Allergies</Label>
                                <Input 
                                    name="allergies" 
                                    value={formData.allergies} 
                                    onChange={handleChange} 
                                    placeholder="Food allergies, medication allergies, etc."
                                />
                            </InputGroup>

                            <ButtonContainer>
                                <SubmitButton type="submit" disabled={isCreating}>
                                    {isCreating ? 'Adding...' : 'Add Pet'}
                                </SubmitButton>
                                <CancelButton type="button" onClick={() => setShowForm(false)} disabled={isCreating}>
                                    Cancel
                                </CancelButton>
                            </ButtonContainer>
                        </Form>
                    </ModalContainer>
                </Overlay>
            )}
        </>
    );
};

export default CreatePetButton;

const AddButton = styled.button`
    background: linear-gradient(135deg, #8b5a8c, #a569a7);
    color: #ffffff;
    padding: 10px 18px;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    box-shadow: 0px 2px 12px rgba(139, 90, 140, 0.25);
    margin: 8px 0;
    width: fit-content;
    
    &:hover {
        background: linear-gradient(135deg, #7d527e, #936394);
        transform: translateY(-1px);
        box-shadow: 0px 4px 16px rgba(139, 90, 140, 0.35);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        padding: 12px 20px;
        font-size: 0.85rem;
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    
    @media (max-width: 768px) {
        padding: 10px;
        align-items: flex-start;
    }
`;

const ModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 24px;
    box-shadow: 0px 20px 60px rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    position: relative;
    
    @media (max-width: 768px) {
        margin: 20px 0;
        border-radius: 20px;
        max-height: none;
        height: auto;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px 16px;
    border-bottom: 2px solid rgba(139, 90, 140, 0.3);
    
    @media (max-width: 768px) {
        padding: 20px 24px 12px;
    }
`;

const ModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.5rem;
    }
`;

const CloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #ffffff;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
`;

const Form = styled.form`
    padding: 20px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    @media (max-width: 768px) {
        padding: 16px 24px 24px;
        gap: 18px;
    }
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const TwoColumnGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 18px;
    }
`;

const Label = styled.label`
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const Input = styled.input`
    padding: 14px 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
    }
`;

const Textarea = styled.textarea`
    padding: 14px 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    min-height: 80px;
    resize: vertical;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
        min-height: 100px;
    }
`;

const Select = styled.select`
    padding: 14px 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }
    
    option {
        background: #4a1a4a;
        color: #ffffff;
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 12px;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 12px;
    }
`;

const SubmitButton = styled.button`
    flex: 1;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    padding: 14px 24px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1.1rem;
    }
`;

const CancelButton = styled.button`
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 14px 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1.1rem;
    }
`;