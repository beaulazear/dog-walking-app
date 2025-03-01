import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import PetInvoices from "./PetInvoices";
import NewAppointmentForm from "./NewAppointmentForm";
import CancellationModal from "./CancellationModal";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // ✅ Import plugin

dayjs.extend(isSameOrAfter); // ✅ Extend dayjs with the plugin

export default function PetsPage() {
    const { user } = useContext(UserContext);
    const [selectedPet, setSelectedPet] = useState(null);

    return (
        <Container>
            {!selectedPet && (
                <>
                    <Title>Your Pets</Title>
                    <Subtitle>Select a pet to view or edit their details.</Subtitle>
                    <PetGrid>
                        {user?.pets
                            ?.slice() // Create a shallow copy to avoid mutating original data
                            .sort((a, b) => a.name.localeCompare(b.name)) // Sort pets alphabetically
                            .map((pet) => (
                                <PetCard key={pet.id} onClick={() => setSelectedPet(pet)}>
                                    <PetImage
                                        src={pet.profile_pic || dogPlaceholder}
                                        onError={(e) => (e.target.src = dogPlaceholder)}
                                        alt={pet.name}
                                    />
                                    <PetName>{pet.name}</PetName>
                                </PetCard>
                            ))}
                    </PetGrid>
                </>
            )}

            {selectedPet && <PetDetails key={selectedPet.id} pet={selectedPet} setSelectedPet={setSelectedPet} />}
        </Container>
    );
}

const PetDetails = ({ pet, setSelectedPet }) => {
    const { setUser, user } = useContext(UserContext);
    const [formData, setFormData] = useState(pet);
    const [appointments, setAppointments] = useState(pet.appointments || []);

    useEffect(() => {
        setFormData(pet);

        if (user?.appointments) {
            const today = dayjs().startOf("day");

            const filteredAppointments = user.appointments.filter(apt => {
                const appointmentDate = dayjs(apt.appointment_date).startOf("day");

                return (
                    apt.pet_id === pet.id &&
                    !apt.completed &&
                    !apt.canceled &&
                    (apt.recurring || appointmentDate.isSameOrAfter(today)) // ✅ Fix: Includes today's appointments
                );
            });

            setAppointments(filteredAppointments);
        }
    }, [pet, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        const response = await fetch(`/pets/${pet.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const updatedPet = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                pets: prevUser.pets.map(p => (p.id === updatedPet.id ? updatedPet : p))
            }));
            alert("Pet details updated!");
            setSelectedPet(null)
        }
    };

    return (
        <DetailsContainer>
            <CloseButton onClick={() => setSelectedPet(null)}>✖ Return to Pets Page</CloseButton>
            <Title>{pet.name}'s Info</Title>
            <Form>
                <Label>Name:</Label>
                <Input name="name" value={formData.name || ""} onChange={handleChange} />
                <Label>Birthdate:</Label>
                <Input type="date" name="birthdate" value={dayjs(formData.birthdate).format("YYYY-MM-DD")} onChange={handleChange} />
                <Label>Behavioral Notes:</Label>
                <Textarea name="behavorial_notes" value={formData.behavorial_notes || ""} onChange={handleChange} />
                <Label>Address:</Label>
                <Input name="address" value={formData.address || ""} onChange={handleChange} />
                <Label>Sex:</Label>
                <Select name="sex" value={formData.sex || ""} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </Select>
                <Label>Spayed/Neutered:</Label>
                <Select name="spayed_neutered" value={formData.spayed_neutered || false} onChange={handleChange}>
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                </Select>
                <UpdateButton onClick={handleUpdate}>Update {pet.name}'s details</UpdateButton>
            </Form>

            <PetAppointments appointments={appointments} pet={pet} />
        </DetailsContainer>
    );
};

const PetAppointments = ({ pet, appointments }) => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    return (
        <AppointmentsContainer>
            <Subtitle>📅 {pet.name}'s Appointments</Subtitle>
            {appointments.length > 0 && (<Text>Click on an appointment to edit, delete, or add cancellations</Text>)}
            {appointments.length === 0 ? (
                <NoAppointments>No appointments scheduled.</NoAppointments>
            ) : (
                appointments.map((apt) => (
                    <AppointmentCard key={apt.id} onClick={() => setSelectedAppointment(apt)}>
                        <Text><strong>{apt.recurring ? 'Recurring' : 'One Time'} {apt.duration} min {apt.solo ? 'solo' : 'group'} walk</strong></Text>
                        {apt.recurring && (
                            <Text>
                                Days of week: {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                                    .filter((day) => apt[day.toLowerCase()])
                                    .join(", ")}
                            </Text>
                        )}
                        {!apt.recurring && (<Text>{dayjs(apt.appointment_date).format("MMM D, YYYY")}</Text>)}
                        <Text>{dayjs(apt.start_time).format("h:mm A")} - {dayjs(apt.end_time).format("h:mm A")}</Text>
                        {(apt.recurring && apt.cancellations?.length > 0) && (
                            <ul>
                                {apt.cancellations.map((cancellation) => (
                                    <li key={cancellation.id}>{dayjs(cancellation.date).format("MMMM D, YYYY")}</li>
                                ))}
                            </ul>
                        )}
                    </AppointmentCard>
                ))
            )}
            {selectedAppointment && (
                <AppointmentDetails
                    appointment={selectedAppointment}
                    setSelectedAppointment={setSelectedAppointment}
                />
            )}
            <NewAppointmentForm pet={pet} />
            <Subtitle>$ {pet.name}'s Invoices</Subtitle>
            <PetInvoices pet={pet} />
        </AppointmentsContainer>
    );
};

const AppointmentDetails = ({ appointment, setSelectedAppointment }) => {
    const { setUser } = useContext(UserContext);
    const [formData, setFormData] = useState({
        ...appointment,
        start_time: dayjs(appointment.start_time).format("HH:mm"),
        end_time: dayjs(appointment.end_time).format("HH:mm"),
    });

    const handleChange = (e) => {
        const { name, type, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? !prev[name] : value
        }));
    };

    const handleUpdate = async () => {
        const response = await fetch(`/appointments/${appointment.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                start_time: formData.start_time.length > 5 ? formData.start_time.slice(11, 16) : formData.start_time, // Extract only HH:mm
                end_time: formData.end_time.length > 5 ? formData.end_time.slice(11, 16) : formData.end_time, // Extract only HH:mm
            }),
        });

        if (response.ok) {
            const updatedAppointment = await response.json();
            console.log("Updated Appointment:", updatedAppointment);
            setUser(prevUser => ({
                ...prevUser,
                appointments: prevUser.appointments.map(a =>
                    a.id === updatedAppointment.id ? updatedAppointment : a
                )
            }));
            alert("Appointment updated!");
            setSelectedAppointment(null);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        const response = await fetch(`/appointments/${appointment.id}/canceled`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canceled: true }) // Ensure we send the update
        });

        if (response.ok) {
            const updatedAppointment = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                appointments: prevUser.appointments.map(a =>
                    a.id === updatedAppointment.id ? updatedAppointment : a
                )
            }));
            alert("Appointment canceled!");
            setSelectedAppointment(null);
        }
    };

    const handleTimeChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <Overlay>
            <ModalContainer>
                <CloseButton onClick={() => setSelectedAppointment(null)}>✖ Close</CloseButton>
                <Title>🗓 Edit Appointment</Title>
                <Form>
                    {formData.recurring ? (
                        <>
                            <Label>Recurring Days:</Label>
                            <DaysContainer>
                                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                                    <DayToggle key={day}>
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
                            <CancellationModal setSelectedAppointment={setSelectedAppointment} appointment={appointment}>Add Cancellations</CancellationModal>
                        </>
                    ) : (
                        <>
                            <Label>Appointment Date:</Label>
                            <Input
                                type="date"
                                name="appointment_date"
                                value={dayjs(formData.appointment_date).format("YYYY-MM-DD")}
                                onChange={handleChange}
                            />
                        </>
                    )}
                    <Label>Start Time:</Label>
                    <Input
                        type="time"
                        name="start_time"
                        value={formData.start_time || ""}
                        onChange={handleTimeChange}
                    />
                    <Label>End Time:</Label>
                    <Input
                        type="time"
                        name="end_time"
                        value={formData.end_time || ""}
                        onChange={handleTimeChange}
                    />
                    <Label>Duration:</Label>
                    <Input type="number" name="duration" value={formData.duration} onChange={handleChange} />
                    <ButtonContainer>
                        <UpdateButton onClick={handleUpdate}>Save Changes</UpdateButton>
                        <DeleteButton onClick={handleCancel}>Cancel Appointment</DeleteButton>
                    </ButtonContainer>
                </Form>
            </ModalContainer>
        </Overlay>
    );
};

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
`;

const Container = styled.div`
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    min-height: 100vh;
    padding: 40px 20px;
    padding-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Title = styled.h2`
    font-size: 2rem;
    color: white;
    margin-bottom: 0px;
`;

const Subtitle = styled.h3`
    font-size: 1.25rem;
    color: white;
`;

const PetGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
`;

const PetCard = styled.div`
    background: rgba(255, 255, 255, 0.2);
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: 0.3s ease-in-out;

    &:hover {
        transform: scale(1.05);
    }
`;

const PetImage = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 10px;
`;

const PetName = styled.h4`
    color: white;
`;

const DetailsContainer = styled.div`
    background: rgba(255, 255, 255, 0.2);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 600px;
    margin-top: 20px;
    text-align: center;
`;

const CloseButton = styled.button`
    background: red;
    color: black;
    border: none;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    top: 10px;
    right: 10px;
    &:hover {
        background: darkred;
    }
`;

const Form = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Label = styled.label`
    color: white;
    text-align: left;
`;

const Input = styled.input`
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 97%;
`;

const Select = styled.select`
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 100%;
`;

const Textarea = styled.textarea`
    padding: 8px;
    border-radius: 6px;
    border: none;
    width: 97%;
`;

const UpdateButton = styled.button`
    background: #007bff;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    
    &:hover {
        background: darkblue;
    }
`;

const AppointmentsContainer = styled.div`
    margin-top: 20px;
    text-align: left;
`;

const AppointmentCard = styled.div`
    background: rgba(255, 255, 255, 0.2);
    padding: 10px;
    border-radius: 8px;
    margin-top: 10px;
`;

const NoAppointments = styled.p`
    color: white;
`;

const Text = styled.p`
    color: #4B0082;
`;

const DeleteButton = styled.button`
    background: red;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 10px;

    &:hover {
        background: darkred;
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6); /* Darkened background */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background: white;
    width: 90%;
    max-width: 600px;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.3);
    background-color: #4B0082;
    text-align: center;
    max-height: 90vh;
    overflow-y: auto;
`;

const DaysContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-bottom: 15px;
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