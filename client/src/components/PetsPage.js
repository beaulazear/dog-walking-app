import React, { useContext, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { 
    Search, 
    Dog, 
    Cat, 
    Bird, 
    Rabbit, 
    Fish,
    MapPin,
    CheckCircle,
    Pause,
    ChevronRight,
    Heart,
    AlertCircle,
    Calendar,
    CalendarDays,
    Clock,
    X,
    Save,
    Trash2
} from "lucide-react";
import { UserContext } from "../context/user";
import PetInvoices from "./PetInvoices";
import NewAppointmentForm from "./NewAppointmentForm";
import CancellationModal from "./CancellationModal";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import CreatePetButton from "./CreatePetButton";

dayjs.extend(isSameOrAfter);

// Helper function to get animal icon based on pet name
const getAnimalIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cat') || lowerName.includes('kitty') || lowerName.includes('felix') || lowerName.includes('whiskers')) {
        return <Cat />;
    }
    if (lowerName.includes('bird') || lowerName.includes('tweet') || lowerName.includes('chirp') || lowerName.includes('parrot')) {
        return <Bird />;
    }
    if (lowerName.includes('fish') || lowerName.includes('gold') || lowerName.includes('nemo')) {
        return <Fish />;
    }
    if (lowerName.includes('rabbit') || lowerName.includes('bunny')) {
        return <Rabbit />;
    }
    // Default to dog for any other pet
    return <Dog />;
};


export default function PetsPage() {
    const { user } = useContext(UserContext);
    const [selectedPet, setSelectedPet] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'

    // Filter pets based on search term and activity status
    const filteredPets = user?.pets
        ?.filter(pet => {
            const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'all' ? true : 
                                  activeFilter === 'active' ? pet.active : 
                                  !pet.active;
            return matchesSearch && matchesFilter;
        })
        ?.sort((a, b) => a.name.localeCompare(b.name)) || [];

    return (
        <Container>
            {!selectedPet && (
                <>
                    <HeaderSection>
                        <TitleSection>
                            <Title>
                                <Heart size={32} />
                                Your Pets
                            </Title>
                            <PetSubtitle>Manage your furry friends</PetSubtitle>
                            <PetSummaryText>
                                <Dog size={16} />
                                {filteredPets?.length || 0} {(filteredPets?.length || 0) === 1 ? 'pet' : 'pets'} registered
                            </PetSummaryText>
                        </TitleSection>
                    </HeaderSection>
                    
                    <ActionSection>
                        <CreatePetButton />
                    </ActionSection>
                    
                    <SearchContainer>
                        <SearchInputContainer>
                            <Search size={16} />
                            <SearchInput
                                type="text"
                                placeholder="Search pets by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </SearchInputContainer>
                    </SearchContainer>
                    
                    <FilterTabsContainer>
                        <FilterTab 
                            $active={activeFilter === 'all'} 
                            onClick={() => setActiveFilter('all')}
                        >
                            All
                        </FilterTab>
                        <FilterTab 
                            $active={activeFilter === 'active'} 
                            onClick={() => setActiveFilter('active')}
                        >
                            <CheckCircle size={14} />
                            Active
                        </FilterTab>
                        <FilterTab 
                            $active={activeFilter === 'inactive'} 
                            onClick={() => setActiveFilter('inactive')}
                        >
                            <Pause size={14} />
                            Inactive
                        </FilterTab>
                    </FilterTabsContainer>
                    
                    {filteredPets?.length === 0 ? (
                        <EmptyState>
                            <EmptyIcon>
                                {searchTerm ? <AlertCircle size={64} /> : <Heart size={64} />}
                            </EmptyIcon>
                            <EmptyTitle>
                                {searchTerm ? 'No pets found' : 'No pets yet'}
                            </EmptyTitle>
                            <EmptyText>
                                {searchTerm ? 'Try adjusting your search' : 'Add your first pet to get started!'}
                            </EmptyText>
                        </EmptyState>
                    ) : (
                        <PetsList>
                            {filteredPets.map((pet) => (
                                <PetListItem key={pet.id} onClick={() => setSelectedPet(pet)}>
                                    <PetIcon>
                                        {getAnimalIcon(pet.name)}
                                    </PetIcon>
                                    <PetInfo>
                                        <PetName>{pet.name}</PetName>
                                        <PetDetailsContainer>
                                            <PetDetail>
                                                <MapPin /> {pet.address?.split(',')[0] || 'No address'}
                                            </PetDetail>
                                        </PetDetailsContainer>
                                    </PetInfo>
                                    <StatusBadge active={pet.active}>
                                        {pet.active ? (
                                            <>
                                                <CheckCircle /> Active
                                            </>
                                        ) : (
                                            <>
                                                <Pause /> Inactive
                                            </>
                                        )}
                                    </StatusBadge>
                                    <ArrowIcon>
                                        <ChevronRight />
                                    </ArrowIcon>
                                </PetListItem>
                            ))}
                        </PetsList>
                    )}
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
        const { name, value } = e.target;
        let processedValue = value;
        
        // Handle boolean values for select fields
        if ((name === 'active' || name === 'spayed_neutered') && typeof value === 'string') {
            processedValue = value === 'true';
        }
        
        setFormData({ ...formData, [name]: processedValue });
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
                <Textarea name="behavioral_notes" value={formData.behavioral_notes || ""} onChange={handleChange} />
                <Label>Address:</Label>
                <Input name="address" value={formData.address || ""} onChange={handleChange} />
                <Label>Sex:</Label>
                <Select name="sex" value={formData.sex || ""} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </Select>
                <Label>Status:</Label>
                <Select name="active" value={formData.active !== undefined ? formData.active : true} onChange={handleChange}>
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
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
    const { setUser } = useContext(UserContext);


    useEffect(() => {
        const deletePastCancellations = async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1); // Moves the threshold to yesterday
            yesterday.setHours(0, 0, 0, 0); // Normalize to midnight

            for (const apt of appointments) {
                if (apt.cancellations) {
                    for (const c of apt.cancellations) {
                        const cancellationDate = new Date(c.date);
                        cancellationDate.setHours(0, 0, 0, 0); // Normalize cancellation date

                        if (cancellationDate <= yesterday) { // Only delete if it's at least a day old
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
    }, [appointments, setUser]);

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

    // Lock body scroll when modal is open and handle ESC key
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedAppointment(null);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setSelectedAppointment]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
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
            body: JSON.stringify({ canceled: true })
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

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedAppointment(null);
        }
    };

    const modalContent = (
        <EditModalOverlay onClick={handleOverlayClick}>
            <EditModalContainer>
                <EditModalHeader>
                    <EditModalTitle>
                        <Calendar size={20} />
                        Edit Appointment
                    </EditModalTitle>
                    <EditModalCloseButton onClick={() => setSelectedAppointment(null)}>
                        <X size={18} />
                    </EditModalCloseButton>
                </EditModalHeader>
                
                <EditModalForm>
                    {formData.recurring ? (
                        <EditInputGroup>
                            <EditLabel>
                                <CalendarDays size={16} />
                                Recurring Days
                            </EditLabel>
                            <EditDaysContainer>
                                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                                    <EditDayToggle key={day} $checked={formData[day]}>
                                        <input
                                            type="checkbox"
                                            name={day}
                                            checked={formData[day]}
                                            onChange={handleChange}
                                        />
                                        <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                    </EditDayToggle>
                                ))}
                            </EditDaysContainer>
                        </EditInputGroup>
                    ) : (
                        <EditInputGroup>
                            <EditLabel>
                                <CalendarDays size={16} />
                                Appointment Date
                            </EditLabel>
                            <EditInput
                                type="date"
                                name="appointment_date"
                                value={dayjs(formData.appointment_date).format("YYYY-MM-DD")}
                                onChange={handleChange}
                            />
                        </EditInputGroup>
                    )}

                    {appointment.recurring && (
                        <EditInputGroup>
                            <CancellationModal setSelectedAppointment={setSelectedAppointment} appointment={appointment}>
                                Add Cancellations
                            </CancellationModal>
                        </EditInputGroup>
                    )}

                    <EditTwoColumnGroup>
                        <EditInputGroup>
                            <EditLabel>
                                <Clock size={16} />
                                Start Time
                            </EditLabel>
                            <EditInput
                                type="time"
                                name="start_time"
                                value={formData.start_time || ""}
                                onChange={handleChange}
                                required
                            />
                        </EditInputGroup>

                        <EditInputGroup>
                            <EditLabel>
                                <Clock size={16} />
                                End Time
                            </EditLabel>
                            <EditInput
                                type="time"
                                name="end_time"
                                value={formData.end_time || ""}
                                onChange={handleChange}
                                required
                            />
                        </EditInputGroup>
                    </EditTwoColumnGroup>

                    <EditInputGroup>
                        <EditLabel>
                            <Clock size={16} />
                            Duration (minutes)
                        </EditLabel>
                        <EditSelect name="duration" value={formData.duration} onChange={handleChange}>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes</option>
                        </EditSelect>
                    </EditInputGroup>

                    <EditButtonGroup>
                        <EditSaveButton onClick={handleUpdate}>
                            <Save size={16} />
                            Save Changes
                        </EditSaveButton>
                        <EditDeleteButton onClick={handleCancel}>
                            <Trash2 size={16} />
                            Cancel Appointment
                        </EditDeleteButton>
                    </EditButtonGroup>
                </EditModalForm>
            </EditModalContainer>
        </EditModalOverlay>
    );

    // Render modal in a portal to escape parent constraints
    return ReactDOM.createPortal(modalContent, document.body);
};

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
`;

const Container = styled.div`
    background: linear-gradient(135deg, #ff6b9d, #c44569, #f8a5c2, #fdcb6e);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    min-height: 100vh;
    padding: 40px 20px;
    padding-top: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    @media (max-width: 768px) {
        padding: 20px 16px;
        padding-top: 100px;
    }
`;

const HeaderSection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 800px;
    margin-bottom: 32px;
    
    @media (max-width: 768px) {
        margin-bottom: 24px;
    }
`;

const TitleSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Title = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 2rem;
        gap: 8px;
    }
`;


const Subtitle = styled.h3`
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const PetSubtitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 12px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const PetSummaryText = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

const ActionSection = styled.div`
    width: 100%;
    max-width: 800px;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    
    @media (max-width: 768px) {
        margin-bottom: 16px;
    }
`;

const SearchContainer = styled.div`
    display: flex;
    width: 100%;
    max-width: 800px;
    margin: 16px 0;

    @media (max-width: 768px) {
        margin: 12px 0;
    }
`;

const SearchInputContainer = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;

    svg {
        position: absolute;
        left: 12px;
        color: rgba(255, 255, 255, 0.6);
        z-index: 1;
        width: 16px;
        height: 16px;
    }

    @media (max-width: 768px) {
        width: 100%;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px 12px 40px;
    border-radius: 20px;
    border: 2px solid rgba(139, 90, 140, 0.3);
    background: rgba(74, 26, 74, 0.9);
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ffffff;
    box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:focus {
        outline: none;
        border-color: #a569a7;
        box-shadow: 0px 4px 20px rgba(165, 105, 167, 0.25);
        background: rgba(74, 26, 74, 1);
    }

    &::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    @media (max-width: 768px) {
        padding: 14px 16px 14px 40px;
        font-size: 16px;
    }
`;

const FilterTabsContainer = styled.div`
    display: flex;
    background: rgba(74, 26, 74, 0.6);
    border-radius: 12px;
    padding: 4px;
    margin-top: 16px;
    border: 1.5px solid rgba(139, 90, 140, 0.3);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    
    @media (max-width: 768px) {
        margin: 12px auto 0 auto;
        width: 100%;
        max-width: 400px;
        align-self: center;
    }
    
    @media (max-width: 480px) {
        max-width: 320px;
        margin: 12px auto 0 auto;
        align-self: center;
    }
`;

const FilterTab = styled.button`
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: ${({ $active }) => 
        $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'transparent'
    };
    color: ${({ $active }) => 
        $active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
    };
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: ${({ $active }) => $active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    min-width: 70px;
    text-shadow: ${({ $active }) => 
        $active ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
    };
    
    svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }
    
    &:hover {
        background: ${({ $active }) => 
            $active 
                ? 'linear-gradient(135deg, #936394, #7d527e)' 
                : 'rgba(255, 255, 255, 0.1)'
        };
        color: ${({ $active }) => 
            $active ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'
        };
    }
    
    @media (max-width: 768px) {
        padding: 10px 12px;
        font-size: 0.75rem;
        min-width: 0;
        
        svg {
            width: 12px;
            height: 12px;
        }
    }
    
    @media (max-width: 480px) {
        padding: 8px 10px;
        gap: 4px;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8));
    border-radius: 24px;
    margin-top: 20px;
    width: 100%;
    max-width: 600px;
    box-shadow: 0px 6px 30px rgba(0, 0, 0, 0.3), 0px 2px 8px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(15px);
    
    @media (max-width: 768px) {
        padding: 32px 16px;
        border-radius: 20px;
    }
`;

const EmptyIcon = styled.div`
    margin-bottom: 16px;
    opacity: 0.8;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
`;

const EmptyTitle = styled.h3`
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #ffffff;
    font-size: 1.5rem;
    margin-bottom: 8px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.3rem;
    }
`;

const EmptyText = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    max-width: 400px;
    line-height: 1.6;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.9rem;
        max-width: 300px;
    }
`;

const PetsList = styled.div`
    width: 100%;
    max-width: 800px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const PetListItem = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8));
    padding: 16px 20px;
    border-radius: 14px;
    border: 1.5px solid rgba(139, 90, 140, 0.4);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    gap: 16px;
    height: 72px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

    &:hover {
        transform: translateY(-2px);
        border-color: #a569a7;
        background: linear-gradient(145deg, rgba(74, 26, 74, 1), rgba(107, 43, 107, 0.9));
        box-shadow: 0 8px 25px rgba(139, 90, 140, 0.3);
    }

    @media (max-width: 768px) {
        padding: 14px 16px;
        height: 68px;
        border-radius: 12px;
        gap: 14px;
        
        &:active {
            transform: translateY(0) scale(0.98);
        }
    }

    @media (max-width: 480px) {
        padding: 12px 14px;
        height: 64px;
        border-radius: 10px;
        gap: 12px;
    }
`;

const PetIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(135deg, rgba(165, 105, 167, 0.2), rgba(139, 90, 140, 0.15));
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    transition: all 0.3s ease;

    svg {
        width: 20px;
        height: 20px;
    }

    ${PetListItem}:hover & {
        background: linear-gradient(135deg, rgba(165, 105, 167, 0.3), rgba(139, 90, 140, 0.25));
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
    }

    @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        
        svg {
            width: 18px;
            height: 18px;
        }
    }

    @media (max-width: 480px) {
        width: 36px;
        height: 36px;
        
        svg {
            width: 16px;
            height: 16px;
        }
    }
`;

const PetInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    min-width: 0; /* Allows text to truncate */
    align-items: flex-start;
`;

const PetName = styled.h3`
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #ffffff;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    text-align: left;
    
    @media (max-width: 768px) {
        font-size: 1rem;
    }
    
    @media (max-width: 480px) {
        font-size: 0.95rem;
    }
`;

const PetDetailsContainer = styled.div`
    display: flex;
    align-items: center;
`;

const PetDetail = styled.span`
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

    svg {
        color: rgba(255, 255, 255, 0.8);
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }
    
    @media (max-width: 768px) {
        font-size: 0.75rem;
    }
`;

const StatusBadge = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'active',
})`
    padding: 4px 8px;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    background: ${props => props.active 
        ? 'rgba(34, 197, 94, 0.15)' 
        : 'rgba(251, 191, 36, 0.15)'};
    color: ${props => props.active ? '#22c55e' : '#f59e0b'};
    border: 1px solid ${props => props.active 
        ? 'rgba(34, 197, 94, 0.3)' 
        : 'rgba(251, 191, 36, 0.3)'};
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(10px);

    svg {
        width: 12px;
        height: 12px;
    }

    @media (max-width: 768px) {
        padding: 3px 6px;
        font-size: 0.65rem;
        
        svg {
            width: 10px;
            height: 10px;
        }
    }
`;

const ArrowIcon = styled.div`
    color: rgba(255, 255, 255, 0.5);
    margin-left: 8px;
    opacity: 0.8;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    
    svg {
        width: 18px;
        height: 18px;
    }

    ${PetListItem}:hover & {
        opacity: 1;
        transform: translateX(4px);
        color: rgba(255, 255, 255, 1);
    }

    @media (max-width: 768px) {
        margin-left: 12px;
        opacity: 0.8;
    }
`;

const DetailsContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    padding: 32px;
    border-radius: 24px;
    box-shadow: 0px 8px 40px rgba(0, 0, 0, 0.3), 0px 2px 8px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 700px;
    margin-top: 20px;
    text-align: center;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(15px);
    
    @media (max-width: 768px) {
        padding: 24px;
        border-radius: 20px;
        margin: 16px;
        width: calc(100% - 32px);
    }
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
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;


const Input = styled.input`
    padding: 14px 16px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    width: 100%;
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
    
    &[type="file"] {
        padding: 12px 14px;
        
        &::file-selector-button {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 6px 12px;
            border-radius: 8px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            cursor: pointer;
            margin-right: 12px;
            transition: all 0.3s ease;
            
            &:hover {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.4);
            }
        }
    }
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.2);
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
        border-radius: 14px;
        
        &[type="file"] {
            padding: 14px;
        }
    }
`;

const Select = styled.select`
    padding: 14px 16px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    width: 100%;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.2);
    }
    
    option {
        background: #4a1a4a;
        color: #ffffff;
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
        border-radius: 14px;
    }
`;

const Textarea = styled.textarea`
    padding: 14px 16px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    width: 100%;
    box-sizing: border-box;
    font-size: 1rem;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    min-height: 80px;
    font-family: 'Poppins', sans-serif;
    transition: all 0.3s ease;
    resize: vertical;
    backdrop-filter: blur(5px);
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.2);
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 16px;
        border-radius: 14px;
        min-height: 100px;
    }
`;

const UpdateButton = styled.button`
    background: linear-gradient(135deg, #8b5a8c, #a569a7);
    color: white;
    padding: 14px 28px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    width: fit-content;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(139, 90, 140, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #7d527e, #936394);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(139, 90, 140, 0.4);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        padding: 16px 32px;
        font-size: 1.1rem;
        border-radius: 14px;
        width: 100%;
    }
`;

const AppointmentsContainer = styled.div`
    margin-top: 32px;
    text-align: left;
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.7), rgba(139, 90, 140, 0.6));
    padding: 24px;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    
    @media (max-width: 768px) {
        padding: 20px;
        border-radius: 14px;
        margin-top: 24px;
    }
`;

const AppointmentCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    padding: 18px;
    border-radius: 12px;
    margin-top: 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    
    &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.15);
    }
    
    @media (max-width: 768px) {
        padding: 20px;
        border-radius: 14px;
        &:active {
            transform: scale(0.98);
        }
    }
`;

const Text = styled.p`
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    line-height: 1.6;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.95rem;
    }
`;






// New styled components for the edit appointment modal
const EditModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(8px);
    padding: 20px;
    box-sizing: border-box;
    animation: modalFadeIn 0.3s ease-out;
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(8px);
        }
    }
`;

const EditModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.95), rgba(139, 90, 140, 0.9));
    width: 100%;
    max-width: 500px;
    border-radius: 20px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 8px 32px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    max-height: calc(100vh - 40px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: center center;
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    @media (max-width: 768px) {
        width: 100%;
        max-width: 400px;
        border-radius: 16px;
        max-height: calc(100vh - 40px);
    }
    
    @media (max-width: 480px) {
        max-width: 350px;
        border-radius: 14px;
    }
`;

const EditModalHeader = styled.div`
    padding: 24px 24px 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.3), rgba(139, 90, 140, 0.2));
    border-radius: 20px 20px 0 0;
    flex-shrink: 0;
    
    @media (max-width: 768px) {
        padding: 20px 20px 16px 20px;
        border-radius: 16px 16px 0 0;
    }
    
    @media (max-width: 480px) {
        border-radius: 14px 14px 0 0;
    }
`;

const EditModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const EditModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
    
    @media (max-width: 768px) {
        padding: 10px 12px;
    }
`;

const EditModalForm = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    /* Custom scrollbar for better UX */
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        margin: 8px 0;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        
        &:hover {
            background: rgba(255, 255, 255, 0.4);
        }
    }
    
    @media (max-width: 768px) {
        padding: 0 20px 20px 20px;
        gap: 18px;
    }
`;

const EditInputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const EditTwoColumnGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 18px;
    }
`;

const EditLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const EditInput = styled.input`
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

const EditSelect = styled.select`
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

const EditDaysContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
    
    @media (max-width: 768px) {
        justify-content: center;
    }
`;

const EditDayToggle = styled.label`
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

const EditButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 8px;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const EditSaveButton = styled.button`
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
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1rem;
    }
`;

const EditDeleteButton = styled.button`
    flex: 1;
    background: linear-gradient(135deg, #ef4444, #dc2626);
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
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        font-size: 1rem;
    }
`;