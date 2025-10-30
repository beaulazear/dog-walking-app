import React, { useContext, useState, useEffect, useMemo } from "react";
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
    Calendar,
    CalendarDays,
    Clock,
    X,
    Save,
    Trash2,
    Plus,
    Edit2,
    DollarSign,
    User,
    ArrowLeft
} from "lucide-react";
import { UserContext } from "../context/user";
import PetInvoices from "./PetInvoices";
import NewAppointmentForm from "./NewAppointmentForm";
import CancellationModal from "./CancellationModal";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

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
    return <Dog />;
};

export default function PetsPage() {
    const { user, addPet } = useContext(UserContext);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('active');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPetFormData, setNewPetFormData] = useState({
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

    // Get the selected pet from user.pets using the ID
    const selectedPet = useMemo(() => {
        if (!selectedPetId || !user?.pets) return null;
        return user.pets.find(p => p.id === selectedPetId);
    }, [selectedPetId, user?.pets]);

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

    const handleNewPetChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewPetFormData({ 
            ...newPetFormData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleNewPetSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch("/pets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPetFormData),
            credentials: "include"
        });

        if (response.ok) {
            const newPet = await response.json();
            // Use smart update - prevents full re-render
            addPet(newPet);
            setShowCreateForm(false);
            setNewPetFormData({
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
            alert("Pet added successfully!");
        } else {
            alert("Failed to add pet. Please try again.");
        }
    };

    return (
        <Container>
            <Header>
                <HeaderTop>
                    <Title>My Pets</Title>
                </HeaderTop>
                
                <SearchAndFilter>
                    <SearchBar>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search pets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </SearchBar>
                    
                    <FilterTabs>
                        <FilterTab 
                            $active={activeFilter === 'all'} 
                            onClick={() => setActiveFilter('all')}
                        >
                            All ({user?.pets?.length || 0})
                        </FilterTab>
                        <FilterTab 
                            $active={activeFilter === 'active'} 
                            onClick={() => setActiveFilter('active')}
                        >
                            <CheckCircle size={16} />
                            Active
                        </FilterTab>
                        <FilterTab 
                            $active={activeFilter === 'inactive'} 
                            onClick={() => setActiveFilter('inactive')}
                        >
                            <Pause size={16} />
                            Inactive
                        </FilterTab>
                        <AddPetTab onClick={() => setShowCreateForm(true)}>
                            <Plus size={16} />
                            New
                        </AddPetTab>
                    </FilterTabs>
                </SearchAndFilter>
            </Header>

            <PetsGrid>
                {filteredPets.map(pet => (
                    <PetCard 
                        key={pet.id} 
                        onClick={() => setSelectedPetId(pet.id)}
                        $active={pet.active}
                    >
                        <PetCardHeader>
                            <PetIcon>{getAnimalIcon(pet.name)}</PetIcon>
                            <PetName>{pet.name}</PetName>
                            <StatusBadge $active={pet.active}>
                                {pet.active ? <CheckCircle size={14} /> : <Pause size={14} />}
                                {pet.active ? 'Active' : 'Inactive'}
                            </StatusBadge>
                        </PetCardHeader>
                        
                        <PetCardInfo>
                            <InfoRow>
                                <MapPin size={14} />
                                <span>{pet.address || 'No address'}</span>
                            </InfoRow>
                            <InfoRow>
                                <Calendar size={14} />
                                <span>Age: {pet.birthdate ? `${dayjs().diff(dayjs(pet.birthdate), 'year')} years` : 'Unknown'}</span>
                            </InfoRow>
                        </PetCardInfo>
                        
                        <ViewDetailsButton>
                            View Details
                            <ChevronRight size={16} />
                        </ViewDetailsButton>
                    </PetCard>
                ))}
            </PetsGrid>

            {filteredPets.length === 0 && (
                <EmptyState>
                    <EmptyIcon>{searchTerm ? <Search size={48} /> : <Heart size={48} />}</EmptyIcon>
                    <EmptyTitle>
                        {searchTerm ? 'No pets found' : 'No pets yet'}
                    </EmptyTitle>
                    <EmptyText>
                        {searchTerm ? 'Try adjusting your search' : 'Add your first pet to get started'}
                    </EmptyText>
                </EmptyState>
            )}

            {selectedPet && (
                <PetDetailsModal pet={selectedPet} onClose={() => setSelectedPetId(null)} />
            )}

            {showCreateForm && (
                <CreatePetModal onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}>
                    <ModalContainer style={{ maxWidth: '600px' }}>
                        <ModalHeader>
                            <ModalTitle>Add New Pet</ModalTitle>
                            <CloseButton onClick={() => setShowCreateForm(false)}>
                                <X size={24} />
                            </CloseButton>
                        </ModalHeader>
                        
                        <ModalScrollContent>
                        <CreatePetForm onSubmit={handleNewPetSubmit}>
                        <FormGrid>
                            <FormGroup>
                                <Label>Pet Name *</Label>
                                <Input 
                                    name="name" 
                                    value={newPetFormData.name} 
                                    onChange={handleNewPetChange} 
                                    required 
                                    placeholder="Enter pet's name"
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>Birthdate</Label>
                                <Input 
                                    type="date" 
                                    name="birthdate" 
                                    value={newPetFormData.birthdate} 
                                    onChange={handleNewPetChange} 
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>Sex</Label>
                                <Select name="sex" value={newPetFormData.sex} onChange={handleNewPetChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </Select>
                            </FormGroup>

                            <FormGroup>
                                <Label>Spayed/Neutered</Label>
                                <Select 
                                    name="spayed_neutered" 
                                    value={newPetFormData.spayed_neutered} 
                                    onChange={handleNewPetChange}
                                >
                                    <option value={false}>No</option>
                                    <option value={true}>Yes</option>
                                </Select>
                            </FormGroup>
                        </FormGrid>

                        <FormGroup>
                            <Label>Address</Label>
                            <Input 
                                name="address" 
                                value={newPetFormData.address} 
                                onChange={handleNewPetChange} 
                                placeholder="Pet's home address"
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Behavioral Notes</Label>
                            <Textarea 
                                name="behavioral_notes" 
                                value={newPetFormData.behavioral_notes} 
                                onChange={handleNewPetChange} 
                                placeholder="Any behavioral notes or special instructions..."
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Supplies Location</Label>
                            <Textarea 
                                name="supplies_location" 
                                value={newPetFormData.supplies_location} 
                                onChange={handleNewPetChange} 
                                placeholder="Where are leashes, treats, etc. located?"
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Allergies</Label>
                            <Input 
                                name="allergies" 
                                value={newPetFormData.allergies} 
                                onChange={handleNewPetChange} 
                                placeholder="Food allergies, medication allergies, etc."
                            />
                        </FormGroup>

                        <FormButtons>
                            <SaveButton type="submit">
                                <Save size={18} />
                                Add Pet
                            </SaveButton>
                            <CancelButton type="button" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </CancelButton>
                        </FormButtons>
                    </CreatePetForm>
                    </ModalScrollContent>
                    </ModalContainer>
                </CreatePetModal>
            )}
        </Container>
    );
}

// New Pet Details Modal Component with Tabs
const PetDetailsModal = ({ pet, onClose }) => {
    const { user, updatePet, updateAppointment, removeAppointment } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('info');
    const [formData, setFormData] = useState(pet);
    // Profile pic removed - using icons instead
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isEditingAppointment, setIsEditingAppointment] = useState(false);
    const [editingAppointmentData, setEditingAppointmentData] = useState(null);


    useEffect(() => {
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
        
        if ((name === 'active' || name === 'spayed_neutered') && typeof value === 'string') {
            processedValue = value === 'true';
        }
        
        setFormData({ ...formData, [name]: processedValue });
    };

    // File upload removed - using icons instead

    const handleUpdate = async () => {
        const formDataToSend = new FormData();

        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });

        const response = await fetch(`/pets/${pet.id}`, {
            method: "PATCH",
            body: formDataToSend,
            credentials: "include"
        });

        if (response.ok) {
            const updatedPet = await response.json();
            // Use smart update - prevents full re-render
            updatePet(updatedPet);
            alert("Pet details updated!");
            setEditMode(false);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;

        const response = await fetch(`/appointments/${appointmentId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (response.ok) {
            // Use smart update - prevents full re-render
            removeAppointment(appointmentId);
            setSelectedAppointment(null);
            alert("Appointment deleted successfully!");
        }
    };

    const handleUpdateAppointment = async () => {
        const response = await fetch(`/appointments/${editingAppointmentData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                appointment: {
                    start_time: editingAppointmentData.start_time,
                    end_time: editingAppointmentData.end_time,
                    duration: editingAppointmentData.duration,
                    solo: editingAppointmentData.solo,
                    appointment_date: editingAppointmentData.appointment_date,
                    recurring: editingAppointmentData.recurring,
                    monday: editingAppointmentData.monday,
                    tuesday: editingAppointmentData.tuesday,
                    wednesday: editingAppointmentData.wednesday,
                    thursday: editingAppointmentData.thursday,
                    friday: editingAppointmentData.friday,
                    saturday: editingAppointmentData.saturday,
                    sunday: editingAppointmentData.sunday
                }
            }),
            credentials: "include"
        });

        if (response.ok) {
            const updatedAppointment = await response.json();

            // Ensure cancellations is always an array
            if (!updatedAppointment.cancellations) {
                updatedAppointment.cancellations = [];
            }

            // Use smart update - prevents full re-render
            updateAppointment(updatedAppointment);

            setAppointments(prev => prev.map(apt =>
                apt.id === updatedAppointment.id ? updatedAppointment : apt
            ));
            
            setSelectedAppointment(updatedAppointment);
            setIsEditingAppointment(false);
            setEditingAppointmentData(null);
            // Use setTimeout to avoid blocking the React update cycle
            setTimeout(() => alert("Appointment updated successfully!"), 0);
        } else {
            const error = await response.json();
            alert(`Error updating appointment: ${error.errors?.join(", ") || "Unknown error"}`);
        }
    };

    const startEditingAppointment = () => {
        setIsEditingAppointment(true);
        setEditingAppointmentData({
            ...selectedAppointment,
            monday: selectedAppointment.monday || false,
            tuesday: selectedAppointment.tuesday || false,
            wednesday: selectedAppointment.wednesday || false,
            thursday: selectedAppointment.thursday || false,
            friday: selectedAppointment.friday || false,
            saturday: selectedAppointment.saturday || false,
            sunday: selectedAppointment.sunday || false,
            solo: selectedAppointment.solo || false
        });
    };

    const handleAppointmentFieldChange = (field, value) => {
        setEditingAppointmentData(prev => ({ ...prev, [field]: value }));
    };

    const modalContent = (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
            <ModalContainer>
                <ModalHeader>
                    <ModalHeaderLeft>
                        <BackButton onClick={onClose}>
                            <ArrowLeft size={24} />
                        </BackButton>
                        <PetModalIcon>{getAnimalIcon(pet.name)}</PetModalIcon>
                        <div>
                            <ModalTitle>{pet.name}</ModalTitle>
                            <ModalSubtitle>
                                <ModalStatusBadge $active={pet.active}>
                                    {pet.active ? <CheckCircle size={14} /> : <Pause size={14} />}
                                    {pet.active ? 'Active' : 'Inactive'}
                                </ModalStatusBadge>
                            </ModalSubtitle>
                        </div>
                    </ModalHeaderLeft>
                </ModalHeader>

                <TabContainer>
                    <Tab 
                        $active={activeTab === 'info'} 
                        onClick={() => setActiveTab('info')}
                    >
                        <User size={18} />
                        <span>Info</span>
                    </Tab>
                    <Tab 
                        $active={activeTab === 'appointments'} 
                        onClick={() => setActiveTab('appointments')}
                    >
                        <Calendar size={18} />
                        <span>Appts</span>
                    </Tab>
                    <Tab 
                        $active={activeTab === 'invoices'} 
                        onClick={() => setActiveTab('invoices')}
                    >
                        <DollarSign size={18} />
                        <span>Bills</span>
                    </Tab>
                </TabContainer>

                <TabContent>
                    {activeTab === 'info' && (
                        <InfoTab>
                            <InfoHeader>
                                <InfoTitle>Pet Information</InfoTitle>
                                {!editMode ? (
                                    <EditButton onClick={() => setEditMode(true)}>
                                        <Edit2 size={16} />
                                        Edit Details
                                    </EditButton>
                                ) : (
                                    <ButtonGroup>
                                        <SaveButton onClick={handleUpdate}>
                                            <Save size={16} />
                                            Save Changes
                                        </SaveButton>
                                        <CancelButton onClick={() => {
                                            setEditMode(false);
                                            setFormData(pet);
                                        }}>
                                            Cancel
                                        </CancelButton>
                                    </ButtonGroup>
                                )}
                            </InfoHeader>

                            {!editMode ? (
                                <InfoGrid>
                                    <InfoItem>
                                        <InfoLabel>Name</InfoLabel>
                                        <InfoValue>{formData.name}</InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>Birthdate</InfoLabel>
                                        <InfoValue>
                                            {formData.birthdate ? dayjs(formData.birthdate).format("MMM D, YYYY") : 'Not set'}
                                        </InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>Age</InfoLabel>
                                        <InfoValue>
                                            {formData.birthdate ? `${dayjs().diff(dayjs(formData.birthdate), 'year')} years` : 'Unknown'}
                                        </InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>Sex</InfoLabel>
                                        <InfoValue>{formData.sex}</InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>Spayed/Neutered</InfoLabel>
                                        <InfoValue>{formData.spayed_neutered ? 'Yes' : 'No'}</InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>Status</InfoLabel>
                                        <InfoValue>{formData.active ? 'Active' : 'Inactive'}</InfoValue>
                                    </InfoItem>
                                    <InfoItem $fullWidth>
                                        <InfoLabel>Address</InfoLabel>
                                        <InfoValue>{formData.address || 'Not provided'}</InfoValue>
                                    </InfoItem>
                                    <InfoItem $fullWidth>
                                        <InfoLabel>Allergies</InfoLabel>
                                        <InfoValue>{formData.allergies || 'None listed'}</InfoValue>
                                    </InfoItem>
                                    <InfoItem $fullWidth>
                                        <InfoLabel>Behavioral Notes</InfoLabel>
                                        <InfoValue>{formData.behavioral_notes || 'No notes'}</InfoValue>
                                    </InfoItem>
                                    <InfoItem $fullWidth>
                                        <InfoLabel>Supplies Location</InfoLabel>
                                        <InfoValue>{formData.supplies_location || 'Not specified'}</InfoValue>
                                    </InfoItem>
                                </InfoGrid>
                            ) : (
                                <EditForm>
                                    <FormGrid>
                                        <FormGroup>
                                            <Label>Name</Label>
                                            <Input 
                                                name="name" 
                                                value={formData.name || ""} 
                                                onChange={handleChange} 
                                            />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Birthdate</Label>
                                            <Input 
                                                type="date" 
                                                name="birthdate" 
                                                value={formData.birthdate ? dayjs(formData.birthdate).format("YYYY-MM-DD") : ""} 
                                                onChange={handleChange} 
                                            />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Sex</Label>
                                            <Select name="sex" value={formData.sex || ""} onChange={handleChange}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </Select>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Spayed/Neutered</Label>
                                            <Select name="spayed_neutered" value={formData.spayed_neutered} onChange={handleChange}>
                                                <option value={true}>Yes</option>
                                                <option value={false}>No</option>
                                            </Select>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Status</Label>
                                            <Select name="active" value={formData.active} onChange={handleChange}>
                                                <option value={true}>Active</option>
                                                <option value={false}>Inactive</option>
                                            </Select>
                                        </FormGroup>
                                    </FormGrid>
                                    <FormGroup>
                                        <Label>Address</Label>
                                        <Input 
                                            name="address" 
                                            value={formData.address || ""} 
                                            onChange={handleChange} 
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Allergies</Label>
                                        <Input 
                                            name="allergies" 
                                            value={formData.allergies || ""} 
                                            onChange={handleChange} 
                                            placeholder="Food allergies, medication allergies, etc."
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Behavioral Notes</Label>
                                        <Textarea 
                                            name="behavioral_notes" 
                                            value={formData.behavioral_notes || ""} 
                                            onChange={handleChange} 
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Supplies Location</Label>
                                        <Textarea 
                                            name="supplies_location" 
                                            value={formData.supplies_location || ""} 
                                            onChange={handleChange} 
                                            placeholder="Where are leashes, treats, etc. located?" 
                                        />
                                    </FormGroup>
                                </EditForm>
                            )}
                        </InfoTab>
                    )}

                    {activeTab === 'appointments' && (
                        <AppointmentsTab>
                            <AppointmentsHeader>
                                <InfoTitle>Appointments</InfoTitle>
                            </AppointmentsHeader>
                            
                            {appointments.length === 0 ? (
                                <EmptyAppointments>
                                    <Calendar size={48} />
                                    <EmptyTitle>No appointments scheduled</EmptyTitle>
                                    <EmptyText>Add an appointment to get started</EmptyText>
                                </EmptyAppointments>
                            ) : (
                                <AppointmentsList>
                                    {appointments.map((apt) => (
                                        <AppointmentCard 
                                            key={apt.id} 
                                            onClick={() => setSelectedAppointment(apt)}
                                        >
                                            <AppointmentHeader>
                                                <AppointmentType $recurring={apt.recurring}>
                                                    {apt.recurring ? 'Recurring' : 'One-time'}
                                                </AppointmentType>
                                                <AppointmentDuration>
                                                    {apt.duration} min {apt.solo ? 'solo' : 'group'} walk
                                                </AppointmentDuration>
                                            </AppointmentHeader>
                                            
                                            <AppointmentDetails>
                                                {apt.recurring ? (
                                                    <DetailRow>
                                                        <CalendarDays size={16} />
                                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                                                            .filter((day, i) => apt[["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][i]])
                                                            .join(", ")}
                                                    </DetailRow>
                                                ) : (
                                                    <DetailRow>
                                                        <Calendar size={16} />
                                                        {dayjs(apt.appointment_date).format("MMM D, YYYY")}
                                                    </DetailRow>
                                                )}
                                                <DetailRow>
                                                    <Clock size={16} />
                                                    {dayjs(apt.start_time).format("h:mm A")} - {dayjs(apt.end_time).format("h:mm A")}
                                                </DetailRow>
                                            </AppointmentDetails>

                                            {apt.recurring && apt.cancellations?.length > 0 && (
                                                <CancellationsList>
                                                    <CancellationsTitle>Cancelled dates:</CancellationsTitle>
                                                    {apt.cancellations.map((c) => (
                                                        <CancellationDate key={c.id}>
                                                            {dayjs(c.date).format("MMM D")}
                                                        </CancellationDate>
                                                    ))}
                                                </CancellationsList>
                                            )}
                                        </AppointmentCard>
                                    ))}
                                </AppointmentsList>
                            )}
                            
                            <NewAppointmentForm pet={pet} />

                            {selectedAppointment && (
                                <AppointmentModal onClick={(e) => e.target === e.currentTarget && setSelectedAppointment(null)}>
                                    <ModalContainer style={{ maxWidth: '600px' }}>
                                        <ModalHeader>
                                            <ModalHeaderLeft>
                                                <BackButton onClick={() => {
                                                    setSelectedAppointment(null);
                                                    setIsEditingAppointment(false);
                                                    setEditingAppointmentData(null);
                                                }}>
                                                    <ArrowLeft size={24} />
                                                </BackButton>
                                                <ModalTitle>Appointment Details</ModalTitle>
                                            </ModalHeaderLeft>
                                            {!isEditingAppointment && (
                                                <EditButton onClick={startEditingAppointment}>
                                                    <Edit2 size={16} />
                                                    Edit
                                                </EditButton>
                                            )}
                                        </ModalHeader>
                                        <AppointmentModalContent>
                                        {!isEditingAppointment ? (
                                            <>
                                                <InfoGrid>
                                                    <InfoItem>
                                                        <InfoLabel>Type</InfoLabel>
                                                        <InfoValue>{selectedAppointment.recurring ? 'Recurring' : 'One-time'}</InfoValue>
                                                    </InfoItem>
                                                    <InfoItem>
                                                        <InfoLabel>Duration</InfoLabel>
                                                        <InfoValue>{selectedAppointment.duration} minutes</InfoValue>
                                                    </InfoItem>
                                                    <InfoItem>
                                                        <InfoLabel>Walk Type</InfoLabel>
                                                        <InfoValue>{selectedAppointment.solo ? 'Solo' : 'Group'}</InfoValue>
                                                    </InfoItem>
                                                    <InfoItem>
                                                        <InfoLabel>Time</InfoLabel>
                                                        <InfoValue>
                                                            {dayjs(selectedAppointment.start_time).format("h:mm A")} - 
                                                            {dayjs(selectedAppointment.end_time).format("h:mm A")}
                                                        </InfoValue>
                                                    </InfoItem>
                                                    {selectedAppointment.recurring && (
                                                        <InfoItem $fullWidth>
                                                            <InfoLabel>Repeats on</InfoLabel>
                                                            <InfoValue>
                                                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                                                                    .filter((day, i) => !!selectedAppointment[["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][i]])
                                                                    .join(", ") || "No days selected"}
                                                            </InfoValue>
                                                        </InfoItem>
                                                    )}
                                                </InfoGrid>
                                                
                                                <ButtonGroup style={{ marginTop: '24px' }}>
                                                    {selectedAppointment.recurring && (
                                                        <PrimaryButton onClick={() => setShowCancellationModal(true)}>
                                                            Add Cancellation Date
                                                        </PrimaryButton>
                                                    )}
                                                    <DeleteButton onClick={() => handleDeleteAppointment(selectedAppointment.id)}>
                                                        <Trash2 size={16} />
                                                        Delete Appointment
                                                    </DeleteButton>
                                                </ButtonGroup>
                                            </>
                                        ) : (
                                            <EditForm>
                                                <FormGrid>
                                                    <FormGroup>
                                                        <Label>Start Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={dayjs(editingAppointmentData.start_time).format("HH:mm")}
                                                            onChange={(e) => {
                                                                const [hours, minutes] = e.target.value.split(':');
                                                                const newTime = new Date(editingAppointmentData.start_time);
                                                                newTime.setHours(hours, minutes);
                                                                handleAppointmentFieldChange('start_time', newTime.toISOString());
                                                            }}
                                                        />
                                                    </FormGroup>
                                                    <FormGroup>
                                                        <Label>End Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={dayjs(editingAppointmentData.end_time).format("HH:mm")}
                                                            onChange={(e) => {
                                                                const [hours, minutes] = e.target.value.split(':');
                                                                const newTime = new Date(editingAppointmentData.end_time);
                                                                newTime.setHours(hours, minutes);
                                                                handleAppointmentFieldChange('end_time', newTime.toISOString());
                                                            }}
                                                        />
                                                    </FormGroup>
                                                    <FormGroup>
                                                        <Label>Duration</Label>
                                                        <Select
                                                            value={editingAppointmentData.duration}
                                                            onChange={(e) => handleAppointmentFieldChange('duration', parseInt(e.target.value))}
                                                        >
                                                            <option value={30}>30 minutes</option>
                                                            <option value={45}>45 minutes</option>
                                                            <option value={60}>60 minutes</option>
                                                        </Select>
                                                    </FormGroup>
                                                    <FormGroup>
                                                        <Label>Walk Type</Label>
                                                        <Select
                                                            value={editingAppointmentData.solo}
                                                            onChange={(e) => handleAppointmentFieldChange('solo', e.target.value === 'true')}
                                                        >
                                                            <option value={false}>Group Walk</option>
                                                            <option value={true}>Solo Walk</option>
                                                        </Select>
                                                    </FormGroup>
                                                </FormGrid>

                                                {!editingAppointmentData.recurring && (
                                                    <FormGroup>
                                                        <Label>Appointment Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={dayjs(editingAppointmentData.appointment_date).format("YYYY-MM-DD")}
                                                            onChange={(e) => handleAppointmentFieldChange('appointment_date', e.target.value)}
                                                        />
                                                    </FormGroup>
                                                )}

                                                {editingAppointmentData.recurring && (
                                                    <FormGroup>
                                                        <Label>Repeat on these days:</Label>
                                                        <DayCheckboxes>
                                                            {[
                                                                { key: 'monday', label: 'Monday' },
                                                                { key: 'tuesday', label: 'Tuesday' },
                                                                { key: 'wednesday', label: 'Wednesday' },
                                                                { key: 'thursday', label: 'Thursday' },
                                                                { key: 'friday', label: 'Friday' },
                                                                { key: 'saturday', label: 'Saturday' },
                                                                { key: 'sunday', label: 'Sunday' }
                                                            ].map(day => (
                                                                <DayCheckbox key={day.key} onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingAppointmentData[day.key]}
                                                                        onChange={(e) => handleAppointmentFieldChange(day.key, e.target.checked)}
                                                                    />
                                                                    <span>{day.label}</span>
                                                                </DayCheckbox>
                                                            ))}
                                                        </DayCheckboxes>
                                                    </FormGroup>
                                                )}

                                                <FormButtons>
                                                    <SaveButton onClick={handleUpdateAppointment}>
                                                        <Save size={16} />
                                                        Save Changes
                                                    </SaveButton>
                                                    <CancelButton onClick={() => {
                                                        setIsEditingAppointment(false);
                                                        setEditingAppointmentData(null);
                                                    }}>
                                                        Cancel
                                                    </CancelButton>
                                                </FormButtons>
                                            </EditForm>
                                        )}
                                        </AppointmentModalContent>
                                    </ModalContainer>
                                </AppointmentModal>
                            )}

                            {showCancellationModal && selectedAppointment && (
                                <CancellationModal
                                    appointment={selectedAppointment}
                                    setSelectedAppointment={setSelectedAppointment}
                                    onClose={() => setShowCancellationModal(false)}
                                />
                            )}
                        </AppointmentsTab>
                    )}

                    {activeTab === 'invoices' && (
                        <InvoicesTab>
                            <PetInvoices pet={pet} />
                        </InvoicesTab>
                    )}
                </TabContent>
            </ModalContainer>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Styled Components
const Container = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    padding-top: 7rem; /* Increased top padding for more space */
    
    @media (max-width: 768px) {
        padding: 1rem;
        padding-top: 5.5rem; /* More space on mobile too */
    }
`;

const Header = styled.div`
    max-width: 1200px;
    margin: 0 auto 2.5rem;
    padding: 0;
    
    @media (max-width: 768px) {
        margin-bottom: 2rem;
    }
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
    
    @media (max-width: 768px) {
        margin-bottom: 1.5rem;
    }
`;

const Title = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 3rem;
    font-weight: 800;
    color: white;
    margin: 0;
    text-align: center;
    letter-spacing: -0.025em;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 2.25rem;
    }
`;

const AddPetTab = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    flex-shrink: 1;
    min-width: 0;
    
    @media (max-width: 768px) {
        padding: 8px 14px;
        font-size: 0.85rem;
        gap: 5px;
        box-shadow: 0 1px 4px rgba(34, 197, 94, 0.3);
        
        svg {
            width: 15px;
            height: 15px;
        }
    }
    
    @media (max-width: 480px) {
        padding: 7px 10px;
        font-size: 0.8rem;
        gap: 4px;
        
        svg {
            width: 14px;
            height: 14px;
        }
    }
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }
`;

const SearchAndFilter = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const SearchBar = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    
    &:focus-within {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }
    
    input {
        flex: 1;
        border: none;
        background: none;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        color: #111827;
        outline: none;
        
        &::placeholder {
            color: #9ca3af;
        }
    }
    
    svg {
        color: #6b7280;
    }
`;

const FilterTabs = styled.div`
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.15);
    padding: 6px;
    border-radius: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    @media (max-width: 768px) {
        gap: 5px;
        padding: 4px;
        flex: 1;
        justify-content: space-between;
    }
    
    @media (max-width: 480px) {
        gap: 3px;
        padding: 3px;
    }
`;

const FilterTab = styled.button`
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.95)' : 'transparent'};
    color: ${props => props.$active ? '#6366f1' : 'rgba(255, 255, 255, 0.9)'};
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 1;
    min-width: 0;
    
    @media (max-width: 768px) {
        padding: 8px 14px;
        font-size: 0.85rem;
        gap: 5px;
        
        svg {
            width: 15px;
            height: 15px;
        }
    }
    
    @media (max-width: 480px) {
        padding: 7px 10px;
        font-size: 0.8rem;
        gap: 4px;
        
        svg {
            width: 14px;
            height: 14px;
        }
    }
    
    &:hover {
        background: ${props => props.$active ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)'};
        transform: translateY(-1px);
    }
`;

const PetsGrid = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const PetCard = styled.div`
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    opacity: ${props => props.$active ? 1 : 0.8};
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
`;

const PetCardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1rem;
`;

const PetIcon = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    svg {
        width: 24px;
        height: 24px;
    }
`;

const PetName = styled.h3`
    flex: 1;
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin: 0;
`;

const StatusBadge = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    background: ${props => props.$active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
    color: ${props => props.$active ? '#16a34a' : '#dc2626'};
    border: 1px solid ${props => props.$active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
`;

const PetCardInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 1rem;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    
    svg {
        width: 14px;
        height: 14px;
        color: #999;
    }
`;

const ViewDetailsButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px;
    background: #6366f1;
    color: white;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
        background: #4f46e5;
        transform: translateY(-1px);
    }
`;

const EmptyState = styled.div`
    max-width: 400px;
    margin: 4rem auto;
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 3rem 2rem;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const EmptyIcon = styled.div`
    margin-bottom: 1rem;
    color: #9ca3af;
    
    svg {
        width: 48px;
        height: 48px;
    }
`;

const EmptyTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: #1f2937;
`;

const EmptyText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
`;

// Modal Styles
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    overflow-y: auto;
    
    @media (max-width: 768px) {
        padding: 0;
        align-items: stretch;
    }
`;

const ModalContainer = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    @media (max-width: 768px) {
        max-height: 100vh;
        height: 100vh;
        border-radius: 0;
        max-width: 100%;
    }
`;

const ModalScrollContent = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    
    /* Custom scrollbar styling */
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`;

const CreatePetModal = styled(ModalOverlay)`
    /* Inherits all styles from ModalOverlay */
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const ModalHeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    
    @media (max-width: 768px) {
        gap: 12px;
    }
`;

const PetModalIcon = styled.div`
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 12px;
    }
    
    svg {
        width: 28px;
        height: 28px;
        
        @media (max-width: 768px) {
            width: 22px;
            height: 22px;
        }
    }
`;

const ModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
    
    @media (max-width: 768px) {
        font-size: 1.25rem;
    }
`;

const ModalSubtitle = styled.div`
    margin-top: 4px;
`;

const ModalStatusBadge = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.$active ? '#16a34a' : 'rgba(255, 255, 255, 0.9)'};
    border: 1px solid ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.3)'};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    padding: 8px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(-2px);
    }
    
    @media (max-width: 768px) {
        margin-right: 4px;
    }
`;

const TabContainer = styled.div`
    display: flex;
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.1);
    padding: 0 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    
    @media (max-width: 768px) {
        padding: 0 8px;
        justify-content: space-around;
        gap: 4px;
    }
    
    &::-webkit-scrollbar {
        display: none;
    }
`;

const Tab = styled.button`
    background: none;
    border: none;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 3px solid ${props => props.$active ? 'white' : 'transparent'};
    margin-bottom: -1px;
    transition: all 0.3s ease;
    flex-shrink: 0;
    white-space: nowrap;
    
    @media (max-width: 768px) {
        padding: 10px 8px;
        font-size: 0.75rem;
        gap: 4px;
        flex: 1;
        justify-content: center;
        min-width: 0;
        
        svg {
            width: 16px;
            height: 16px;
        }
        
        /* Show only icons on very small screens */
        @media (max-width: 400px) {
            padding: 12px 4px;
            
            span {
                display: none;
            }
            
            svg {
                width: 20px;
                height: 20px;
            }
        }
    }
    
    &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }
`;

const TabContent = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const InfoTab = styled.div``;

const InfoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const InfoTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin: 0;
`;

const EditButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
`;

const InfoItem = styled.div`
    ${props => props.$fullWidth && 'grid-column: 1 / -1;'}
`;

const InfoLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: white;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
`;

const EditForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Label = styled.label`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
`;

const Input = styled.input`
    padding: 10px 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: white;
        background: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
    }
`;

const Select = styled.select`
    padding: 10px 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: white;
        background: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
    }
`;

const Textarea = styled.textarea`
    padding: 10px 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    min-height: 100px;
    resize: vertical;
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: white;
        background: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

const SaveButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
`;

const CancelButton = styled.button`
    padding: 10px 20px;
    background: #f3f4f6;
    color: #666;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: #e5e7eb;
    }
`;

const AppointmentsTab = styled.div``;

const AppointmentsHeader = styled.div`
    margin-bottom: 24px;
`;

const AppointmentsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
`;

const AppointmentCard = styled.div`
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
    }
`;

const AppointmentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const AppointmentType = styled.span`
    padding: 4px 12px;
    border-radius: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    background: ${props => props.$recurring ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)'};
    color: ${props => props.$recurring ? '#2563eb' : '#7c3aed'};
`;

const AppointmentDuration = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: white;
`;

const AppointmentDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const DetailRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    
    svg {
        width: 16px;
        height: 16px;
        color: rgba(255, 255, 255, 0.8);
    }
`;

const CancellationsList = styled.div`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const CancellationsTitle = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 6px;
`;

const CancellationDate = styled.span`
    display: inline-block;
    padding: 2px 8px;
    margin: 2px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border-radius: 4px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
`;

const EmptyAppointments = styled.div`
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.7);
    
    svg {
        margin-bottom: 16px;
        color: rgba(255, 255, 255, 0.5);
    }
`;

const AppointmentModal = styled(ModalOverlay)``;

const AppointmentModalContent = styled.div`
    padding: 24px;
`;

const DayCheckboxes = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 8px;
`;

const DayCheckbox = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: #374151;
    
    input[type="checkbox"] {
        cursor: pointer;
        width: 18px;
        height: 18px;
    }
    
    span {
        user-select: none;
    }
    
    &:hover {
        color: #6366f1;
    }
`;

const PrimaryButton = styled.button`
    padding: 10px 20px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
`;

const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 2px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
    }
`;

const InvoicesTab = styled.div``;

const CreatePetForm = styled.form`
    padding: 24px;
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const FormButtons = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 24px;
`;

export {
    Container,
    Header,
    HeaderTop,
    Title,
    AddPetTab,
    SearchAndFilter,
    SearchBar,
    FilterTabs,
    FilterTab,
    PetsGrid,
    PetCard,
    PetCardHeader,
    PetIcon,
    PetName,
    StatusBadge,
    PetCardInfo,
    InfoRow,
    ViewDetailsButton,
    EmptyState,
    EmptyIcon,
    EmptyTitle,
    EmptyText,
    ModalOverlay,
    ModalContainer,
    ModalScrollContent,
    CreatePetModal,
    ModalHeader,
    ModalHeaderLeft,
    PetModalIcon,
    ModalTitle,
    ModalSubtitle,
    ModalStatusBadge,
    CloseButton,
    BackButton,
    TabContainer,
    Tab,
    TabContent,
    InfoTab,
    InfoHeader,
    InfoTitle,
    EditButton,
    InfoGrid,
    InfoItem,
    InfoLabel,
    InfoValue,
    EditForm,
    FormGrid,
    FormGroup,
    Label,
    Input,
    Select,
    Textarea,
    ButtonGroup,
    SaveButton,
    CancelButton,
    AppointmentsTab,
    AppointmentsHeader,
    AppointmentsList,
    AppointmentCard,
    AppointmentHeader,
    AppointmentType,
    AppointmentDuration,
    AppointmentDetails,
    DetailRow,
    CancellationsList,
    CancellationsTitle,
    CancellationDate,
    EmptyAppointments,
    AppointmentModal,
    AppointmentModalContent,
    DayCheckboxes,
    DayCheckbox,
    PrimaryButton,
    DeleteButton,
    InvoicesTab,
    CreatePetForm,
    FormButtons
};