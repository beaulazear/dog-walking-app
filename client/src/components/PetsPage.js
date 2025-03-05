import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import PetInvoices from "./PetInvoices";
import NewAppointmentForm from "./NewAppointmentForm";
import CancellationModal from "./CancellationModal";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import CreatePetButton from "./CreatePetButton";

dayjs.extend(isSameOrAfter);

export default function PetsPage() {
    const { user } = useContext(UserContext);
    const [selectedPet, setSelectedPet] = useState(null);

    return (
        <Container>
            {!selectedPet && (
                <>
                    <TitleOne>Your Pets</TitleOne>
                    <SubtitleOne>Select a pet to view or edit their details, appointments, & invoices.</SubtitleOne>
                    <CreatePetButton />
                    <PetGrid>
                        {user?.pets
                            ?.slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
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
    const [newProfilePic, setNewProfilePic] = useState(null);

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
                    (apt.recurring || appointmentDate.isSameOrAfter(today))
                );
            });

            setAppointments(filteredAppointments);
        }
    }, [pet, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setNewProfilePic(e.target.files[0]);
    };

    const handleUpdate = async () => {
        const formDataToSend = new FormData();

        Object.keys(formData).forEach(key => {
            if (key !== "profile_pic") {
                formDataToSend.append(key, formData[key]);
            }
        });

        if (newProfilePic instanceof File) {
            formDataToSend.append("profile_pic", newProfilePic);
        }

        const response = await fetch(`/pets/${pet.id}`, {
            method: "PATCH",
            body: formDataToSend,
        });

        if (response.ok) {
            const updatedPet = await response.json();
            console.log(user, user.pets)
            setUser(user => ({
                ...user,
                pets: [...user.pets.map(p => (p.id === updatedPet.id ? { ...updatedPet } : p))]
            }));
            alert("Pet details updated!");
            setSelectedPet(null);
        }
    };

    return (
        <DetailsContainer>
            <HeaderContainer>
                <Title>{pet.name}</Title>
                <CloseButton onClick={() => setSelectedPet(null)}>✖ Exit</CloseButton>
            </HeaderContainer>
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
                <Label>Profile Picture:</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                <UpdateButton onClick={handleUpdate}>Update details</UpdateButton>
            </Form>

            <PetAppointments appointments={appointments} pet={pet} />
        </DetailsContainer>
    );
};

const PetAppointments = ({ pet, appointments }) => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const { user, setUser } = useContext(UserContext);


    useEffect(() => {
        const deletePastCancellations = async () => {
            const today = new Date();

            for (const apt of appointments) {
                if (apt.cancellations) {
                    for (const c of apt.cancellations) {
                        const cancellationDate = new Date(c.date);

                        if (cancellationDate < today) {
                            try {
                                const response = await fetch(`/cancellations/${c.id}`, {
                                    method: "DELETE",
                                });

                                if (response.ok) {
                                    setUser(user => ({
                                        ...user,
                                        appointments: user.appointments.map(apt => ({
                                            ...apt,
                                            cancellations: apt.cancellations.filter(cancel => cancel.id !== c.id)
                                        }))
                                    }));
                                } else {
                                    console.error(`Failed to delete cancellation ID: ${c.id}`);
                                }
                            } catch (error) {
                                console.error("Error deleting cancellation:", error);
                            }
                        }
                    }
                }
            }
        };

        deletePastCancellations();
    }, [appointments]);

    return (
        <AppointmentsContainer>
            <Subtitle>📅 Appointments</Subtitle>
            {appointments.length > 0 && (<Text>Click on an appointment to edit, delete, or add cancellations</Text>)}
            {appointments.length === 0 ? (
                <Text>No appointments scheduled.</Text>
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
            <Subtitle>💰 Invoices</Subtitle>
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
                start_time: formData.start_time.length > 5 ? formData.start_time.slice(11, 16) : formData.start_time,
                end_time: formData.end_time.length > 5 ? formData.end_time.slice(11, 16) : formData.end_time,
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
                <HeaderContainer>
                    <TitleOne>Edit Form</TitleOne>
                    <CloseButton onClick={() => setSelectedAppointment(null)}>✖ Close</CloseButton>
                </HeaderContainer>
                <Form>
                    {formData.recurring ? (
                        <>
                            <LabelOne style={{ textAlign: 'center' }}>Recurring Days:</LabelOne>
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
                        </>
                    ) : (
                        <>
                            <LabelOne>Appointment Date:</LabelOne>
                            <Input
                                type="date"
                                name="appointment_date"
                                value={dayjs(formData.appointment_date).format("YYYY-MM-DD")}
                                onChange={handleChange}
                            />
                        </>
                    )}
                    {appointment.recurring && (<CancellationModal setSelectedAppointment={setSelectedAppointment} appointment={appointment}>Add Cancellations</CancellationModal>)}
                    <LabelOne>Start Time:</LabelOne>
                    <Input
                        type="time"
                        name="start_time"
                        value={formData.start_time || ""}
                        onChange={handleTimeChange}
                    />
                    <LabelOne>End Time:</LabelOne>
                    <Input
                        type="time"
                        name="end_time"
                        value={formData.end_time || ""}
                        onChange={handleTimeChange}
                    />
                    <LabelOne>Duration:</LabelOne>
                    <Input type="number" name="duration" value={formData.duration} onChange={handleChange} />
                    <HeaderContainer>
                        <UpdateButton onClick={handleUpdate}>Save Changes</UpdateButton>
                        <DeleteButton onClick={handleCancel}>Cancel Appointment</DeleteButton>
                    </HeaderContainer>
                </Form>
            </ModalContainer>
        </Overlay>
    );
};

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
`;

const Container = styled.div`
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    min-height: 100vh;
    padding: 40px 35px;
    padding-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Title = styled.h2`
    font-size: 2rem;
    color: #4B0082;
    margin-bottom: 2px;
    margin-top: 2px;
    text-align: left;
`;

const TitleOne = styled.h2`
    font-size: 2rem;
    color: white;
    margin-bottom: 2px;
    margin-top: 5px;
`;

const Subtitle = styled.h3`
    font-size: 1.25rem;
    color: #4B0082;
`;
const SubtitleOne = styled.h3`
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
    padding: 10px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: 0.3s ease-in-out;
    width: 75px;
    height: 125px;

    &:hover {
        transform: scale(1.05);
    }
`;

const PetImage = styled.img`
    width: 80px;
    height: 80px;
    object-fit: cover;
`;

const PetName = styled.h4`
    color: white;
    margin-top: 5px;
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
    color: #4B0082;
    text-align: left;
`;

const LabelOne = styled.label`
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
    font-weight: bold;
    width: fit-content;
    
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
    font-weight: bold;
    width: fit-content;

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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background: white;
    width: 80%;
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