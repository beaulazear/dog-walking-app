import React, { useContext, useState } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";

const NewAppointmentForm = ({ pet }) => {
    const { user, setUser } = useContext(UserContext);
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        user_id: user.id,
        pet_id: pet.id,
        appointment_date: dayjs().format("YYYY-MM-DD"), // Default to today
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

    const toggleForm = () => setShowForm((prev) => !prev); // ✅ Toggles form visibility

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        try {
            const response = await fetch("/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAppointment),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error:", errorData);
                alert(errorData.errors?.join(", ") || "Failed to create appointment");
                return;
            }

            const createdAppointment = await response.json();

            setUser(prevUser => ({
                ...prevUser,
                appointments: [...prevUser.appointments, createdAppointment],
            }));

            alert("Appointment created successfully!");
        } catch (error) {
            console.error("Error submitting appointment:", error);
        }
    };

    return (
        <>
            <ButtonContainer>
                <ToggleButton onClick={toggleForm}>
                    {showForm ? "Cancel" : "➕ Schedule a New Appointment"}
                </ToggleButton>
            </ButtonContainer>

            {showForm && (
                <FormContainer>
                    <Subtitle>Schedule a New Appointment</Subtitle>
                    <Form onSubmit={handleSubmit}>
                        <Label>Recurring Appointment?</Label>
                        <Select name="recurring" value={formData.recurring} onChange={handleChange}>
                            <option value={false}>No</option>
                            <option value={true}>Yes</option>
                        </Select>

                        {!formData.recurring && (
                            <>
                                <Label>Appointment Date:</Label>
                                <Input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} />
                            </>
                        )}

                        {formData.recurring && (
                            <>
                                <Label>Select Recurring Days:</Label>
                                <DaysContainer>
                                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                        <DayToggle key={day}>
                                            <input type="checkbox" name={day} checked={formData[day]} onChange={handleChange} />
                                            <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                        </DayToggle>
                                    ))}
                                </DaysContainer>
                            </>
                        )}

                        <Label>Start Time:</Label>
                        <Input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />

                        <Label>End Time:</Label>
                        <Input type="time" name="end_time" value={formData.end_time} onChange={handleChange} />

                        <Label>Duration (minutes):</Label>
                        <Input type="number" name="duration" value={formData.duration} onChange={handleChange} />

                        <Label>Solo Walk?</Label>
                        <Select name="solo" value={formData.solo} onChange={handleChange}>
                            <option value={false}>No</option>
                            <option value={true}>Yes</option>
                        </Select>

                        <SubmitButton type="submit">Add Appointment</SubmitButton>
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
    margin-bottom: 10px;
    margin-top: 15px;
`;

const ToggleButton = styled.button`
    background: #28a745;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: bold;
    width: fit-content;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: darkgreen;
    }
`;

const FormContainer = styled.div`
    margin-top: 20px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
`;

const Subtitle = styled.h3`
    color: #4B0082;
    margin-bottom: 10px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Label = styled.label`
    color: #4B0082;
    font-size: 1rem;
`;

const Input = styled.input`
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 95%;
`;

const Select = styled.select`
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 100%;
`;

const DaysContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
`;

const DayToggle = styled.label`
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    color: white;
    transition: background 0.3s;

    input {
        cursor: pointer;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const SubmitButton = styled.button`
    background: #28a745;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
        background: darkgreen;
    }
`;
