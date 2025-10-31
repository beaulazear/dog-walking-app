import React, { useContext, useState } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import { Calendar, Clock, Plus, X, Users, Repeat, CalendarDays } from "lucide-react";
import toast from 'react-hot-toast';

const NewAppointmentForm = ({ pet }) => {
    const { user, addAppointment } = useContext(UserContext);
    const [showForm, setShowForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        user_id: user.id,
        pet_id: pet.id,
        appointment_date: dayjs().format("YYYY-MM-DD"),
        start_time: "",
        end_time: "",
        duration: 30,
        recurring: false,
        solo: false,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
    });

    const toggleForm = () => setShowForm((prev) => !prev);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isCreating) return;

        const newAppointment = {
            user_id: user.id,
            pet_id: pet.id,
            appointment_date: formData.appointment_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            duration: formData.duration,
            recurring: formData.recurring,
            monday: formData.monday,
            tuesday: formData.tuesday,
            wednesday: formData.wednesday,
            thursday: formData.thursday,
            friday: formData.friday,
            saturday: formData.saturday,
            sunday: formData.sunday,
        };

        setIsCreating(true);
        try {
            const response = await fetch("/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAppointment),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error:", errorData);
                toast.error(errorData.errors?.join(", ") || "Failed to create appointment");
                return;
            }

            const createdAppointment = await response.json();

            // Use smart update - prevents full re-render
            addAppointment(createdAppointment);

            toast.success("Appointment created successfully!");
            toggleForm();
        } catch (error) {
            console.error("Error submitting appointment:", error);
            toast.error("An error occurred while creating the appointment.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <ButtonContainer>
                <ToggleButton onClick={toggleForm}>
                    {showForm ? (
                        <>
                            <X size={16} />
                            Close Form
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            Schedule Appointment
                        </>
                    )}
                </ToggleButton>
            </ButtonContainer>
            
            {showForm && (
                <FormContainer>
                    <FormHeader>
                        <FormTitle>
                            <Calendar size={20} />
                            New Appointment
                        </FormTitle>
                        <FormSubtitle>Schedule a walk for {pet.name}</FormSubtitle>
                    </FormHeader>
                    
                    <Form onSubmit={handleSubmit}>
                        <InputGroup>
                            <Label>
                                <Repeat size={16} />
                                Appointment Type
                            </Label>
                            <Select name="recurring" value={formData.recurring} onChange={handleChange}>
                                <option value={false}>One-time appointment</option>
                                <option value={true}>Recurring schedule</option>
                            </Select>
                        </InputGroup>

                        {!formData.recurring ? (
                            <InputGroup>
                                <Label>
                                    <CalendarDays size={16} />
                                    Date
                                </Label>
                                <Input 
                                    type="date" 
                                    name="appointment_date" 
                                    value={formData.appointment_date} 
                                    onChange={handleChange} 
                                />
                            </InputGroup>
                        ) : (
                            <InputGroup>
                                <Label>
                                    <CalendarDays size={16} />
                                    Recurring Days
                                </Label>
                                <DaysContainer>
                                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                        <DayToggle key={day} $checked={formData[day]}>
                                            <input 
                                                type="checkbox" 
                                                name={day} 
                                                checked={formData[day]} 
                                                onChange={handleChange} 
                                            />
                                            <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                        </DayToggle>
                                    ))}
                                </DaysContainer>
                            </InputGroup>
                        )}

                        <TwoColumnGroup>
                            <InputGroup>
                                <Label>
                                    <Clock size={16} />
                                    Start Time
                                </Label>
                                <Input 
                                    type="time" 
                                    name="start_time" 
                                    value={formData.start_time} 
                                    onChange={handleChange} 
                                    required
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>
                                    <Clock size={16} />
                                    End Time
                                </Label>
                                <Input 
                                    type="time" 
                                    name="end_time" 
                                    value={formData.end_time} 
                                    onChange={handleChange} 
                                    required
                                />
                            </InputGroup>
                        </TwoColumnGroup>

                        <TwoColumnGroup>
                            <InputGroup>
                                <Label>
                                    <Clock size={16} />
                                    Duration (minutes)
                                </Label>
                                <Select name="duration" value={formData.duration} onChange={handleChange}>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </Select>
                            </InputGroup>

                            <InputGroup>
                                <Label>
                                    <Users size={16} />
                                    Walk Type
                                </Label>
                                <Select name="solo" value={formData.solo} onChange={handleChange}>
                                    <option value={false}>Group walk</option>
                                    <option value={true}>Solo walk</option>
                                </Select>
                            </InputGroup>
                        </TwoColumnGroup>

                        <ButtonGroup>
                            <SubmitButton type="submit" disabled={isCreating}>
                                <Plus size={16} />
                                {isCreating ? 'Creating...' : 'Create Appointment'}
                            </SubmitButton>
                            <CancelButton type="button" onClick={toggleForm} disabled={isCreating}>
                                <X size={16} />
                                Cancel
                            </CancelButton>
                        </ButtonGroup>
                    </Form>
                </FormContainer>
            )}
        </>
    );
};

export default NewAppointmentForm;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    margin: 16px 0;
`;

const ToggleButton = styled.button`
    background: linear-gradient(135deg, #8b5a8c, #a569a7);
    color: #ffffff;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(139, 90, 140, 0.3);

    &:hover {
        background: linear-gradient(135deg, #7d527e, #936394);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(139, 90, 140, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 14px 24px;
        font-size: 0.85rem;
    }
`;

const FormContainer = styled.div`
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.8), rgba(139, 90, 140, 0.6));
    border-radius: 20px;
    padding: 24px;
    margin-top: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        padding: 20px;
        border-radius: 16px;
    }
`;

const FormHeader = styled.div`
    margin-bottom: 24px;
    text-align: center;
`;

const FormTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const FormSubtitle = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
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
        gap: 20px;
    }
`;

const Label = styled.label`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const Input = styled.input`
    padding: 12px 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
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
        padding: 14px 16px;
        font-size: 16px;
    }
`;

const Select = styled.select`
    padding: 12px 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
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
        padding: 14px 16px;
        font-size: 16px;
    }
`;

const DaysContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
    
    @media (max-width: 768px) {
        justify-content: center;
    }
`;

const DayToggle = styled.label`
    display: flex;
    align-items: center;
    gap: 6px;
    background: ${props => props.$checked ? 'rgba(139, 90, 140, 0.6)' : 'rgba(255, 255, 255, 0.1)'};
    border: 2px solid ${props => props.$checked ? 'rgba(139, 90, 140, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #ffffff;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);

    input {
        cursor: pointer;
        accent-color: #8b5a8c;
    }

    &:hover {
        background: ${props => props.$checked ? 'rgba(139, 90, 140, 0.7)' : 'rgba(255, 255, 255, 0.15)'};
        border-color: ${props => props.$checked ? 'rgba(139, 90, 140, 0.9)' : 'rgba(255, 255, 255, 0.3)'};
        transform: translateY(-1px);
    }
    
    @media (max-width: 768px) {
        padding: 10px 14px;
        font-size: 0.75rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 8px;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const SubmitButton = styled.button`
    flex: 1;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1rem;
    }
`;

const CancelButton = styled.button`
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 14px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1rem;
    }
`;