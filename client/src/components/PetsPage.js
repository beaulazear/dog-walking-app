import React, { useContext, useState, useEffect, useMemo, memo, useCallback } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "motion/react";
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
    CalendarX,
    Clock,
    X,
    Save,
    Trash2,
    Plus,
    Edit2,
    DollarSign,
    User,
    ArrowLeft,
    Share2
} from "lucide-react";
import { UserContext } from "../context/user";
import PetInvoices from "./PetInvoices";
import NewAppointmentForm from "./NewAppointmentForm";
import CancellationModal from "./CancellationModal";
import ShareAppointmentModal from "./ShareAppointmentModal";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from './ConfirmModal';

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

// Memoized PetCard component to prevent unnecessary re-renders
const PetCard = memo(({ pet, appointmentCount, onPetClick }) => {
    return (
        <StyledPetCard $active={pet.active}>
            <PetCardHeader onClick={() => onPetClick(pet.id, 'info')}>
                <PetIcon>{getAnimalIcon(pet.name)}</PetIcon>
                <PetName>{pet.name}</PetName>
                <StatusBadge $active={pet.active}>
                    {pet.active ? <CheckCircle size={14} /> : <Pause size={14} />}
                    {pet.active ? 'Active' : 'Inactive'}
                </StatusBadge>
                <ChevronIcon>
                    <ChevronRight size={20} />
                </ChevronIcon>
            </PetCardHeader>

            <PetCardInfo onClick={() => onPetClick(pet.id, 'info')}>
                <InfoRow>
                    <MapPin size={14} />
                    <span>{pet.address || 'No address'}</span>
                </InfoRow>
            </PetCardInfo>

            <QuickActionsRow>
                <QuickActionButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onPetClick(pet.id, 'appointments');
                    }}
                    title="View and schedule appointments"
                >
                    <CalendarDays size={16} />
                    <span>Appointments {appointmentCount > 0 ? `(${appointmentCount})` : ''}</span>
                </QuickActionButton>
                <QuickActionButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onPetClick(pet.id, 'invoices');
                    }}
                    title="View invoices"
                >
                    <DollarSign size={16} />
                    <span>Invoices</span>
                </QuickActionButton>
            </QuickActionsRow>
        </StyledPetCard>
    );
});

PetCard.displayName = 'PetCard';

export default function PetsPage() {
    const { user, addPet } = useContext(UserContext);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedTab, setSelectedTab] = useState('info');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('active');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isCreatingPet, setIsCreatingPet] = useState(false);
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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Get the selected pet from user.pets using the ID
    const selectedPet = useMemo(() => {
        if (!selectedPetId || !user?.pets) return null;
        return user.pets.find(p => p.id === selectedPetId);
    }, [selectedPetId, user?.pets]);

    // Calculate pet counts
    const totalPets = user?.pets?.length || 0;
    const activePets = user?.pets?.filter(pet => pet.active).length || 0;
    const inactivePets = user?.pets?.filter(pet => !pet.active).length || 0;

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

    // Helper function to get upcoming appointments count for a pet
    const getUpcomingAppointmentsCount = (petId) => {
        if (!user?.appointments) return 0;
        const today = dayjs().startOf("day");
        return user.appointments.filter(apt => {
            const appointmentDate = dayjs(apt.appointment_date).startOf("day");
            return (
                apt.pet_id === petId &&
                !apt.completed &&
                !apt.canceled &&
                (apt.recurring || appointmentDate.isSameOrAfter(today))
            );
        }).length;
    };

    const handlePetClick = useCallback((petId, tab = 'info') => {
        setSelectedPetId(petId);
        setSelectedTab(tab);
    }, []);

    const handleNewPetChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewPetFormData({ 
            ...newPetFormData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleNewPetSubmit = async (e) => {
        e.preventDefault();

        if (isCreatingPet) return;

        setIsCreatingPet(true);
        try {
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
                toast.success("Pet added successfully!");
            } else {
                toast.error("Failed to add pet. Please try again.");
            }
        } finally {
            setIsCreatingPet(false);
        }
    };

    return (
        <>
        <Container>
            <Header>
                <HeaderContent>
                    <PageTitle>
                        <Dog size={24} />
                        My Pets
                    </PageTitle>
                    <PageSubtitle>
                        {totalPets} {totalPets === 1 ? 'pet' : 'pets'} • {activePets} active
                    </PageSubtitle>
                </HeaderContent>
                <HeaderButtonGroup>
                    <HeaderButton
                        onClick={() => setShowCreateForm(true)}
                        title="Add new pet"
                    >
                        <Plus size={18} />
                    </HeaderButton>
                </HeaderButtonGroup>
            </Header>

            <SearchAndFilterSection>
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
                            All ({totalPets})
                        </FilterTab>
                        <FilterTab
                            $active={activeFilter === 'active'}
                            onClick={() => setActiveFilter('active')}
                        >
                            <CheckCircle size={16} />
                            Active ({activePets})
                        </FilterTab>
                        <FilterTab
                            $active={activeFilter === 'inactive'}
                            onClick={() => setActiveFilter('inactive')}
                        >
                            <Pause size={16} />
                            Inactive ({inactivePets})
                        </FilterTab>
                    </FilterTabs>
                </SearchAndFilter>
            </SearchAndFilterSection>

            <PetsGrid>
                {filteredPets.map(pet => (
                    <PetCard
                        key={pet.id}
                        pet={pet}
                        appointmentCount={getUpcomingAppointmentsCount(pet.id)}
                        onPetClick={handlePetClick}
                    />
                ))}
            </PetsGrid>

            {filteredPets.length === 0 && (
                <EmptyState>
                    <EmptyIcon>{searchTerm ? <Search size={48} /> : <Heart size={48} />}</EmptyIcon>
                    <EmptyTitle>
                        {searchTerm ? 'No pets found' : 'Welcome to Your Pet Management Dashboard'}
                    </EmptyTitle>
                    <EmptyText>
                        {searchTerm ?
                            'Try adjusting your search terms or filters to find the pet you\'re looking for.' :
                            'Get started by adding your first pet. Once added, you can manage their appointments, track invoices, and keep all important information in one place.'
                        }
                    </EmptyText>
                    {!searchTerm && (
                        <EmptyStateButton onClick={() => setShowCreateForm(true)}>
                            <Plus size={20} />
                            Add Your First Pet
                        </EmptyStateButton>
                    )}
                </EmptyState>
            )}

            {selectedPet && (
                <PetDetailsModal
                    pet={selectedPet}
                    initialTab={selectedTab}
                    onClose={() => {
                        setSelectedPetId(null);
                        setSelectedTab('info');
                    }}
                />
            )}
        </Container>

        {showCreateForm && ReactDOM.createPortal(
            <CreatePetModalOverlay onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}>
                <CreatePetModalContent>
                                <ModalContainer style={{ maxWidth: '600px', marginBottom: 0 }}>
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
                                        <SaveButton type="submit" disabled={isCreatingPet}>
                                            <Save size={18} />
                                            {isCreatingPet ? 'Adding...' : 'Add Pet'}
                                        </SaveButton>
                                        <CancelButton type="button" onClick={() => setShowCreateForm(false)} disabled={isCreatingPet}>
                                            Cancel
                                        </CancelButton>
                                    </FormButtons>
                                </CreatePetForm>
                                </ModalScrollContent>
                                </ModalContainer>
                    </CreatePetModalContent>
                </CreatePetModalOverlay>,
            document.body
        )}
        </>
    );
}

// Memoized Pet Details Modal Component with Tabs
const PetDetailsModal = memo(({ pet, initialTab = 'info', onClose }) => {
    const { user, updatePet, updateAppointment, removeAppointment } = useContext(UserContext);
    const { confirmState, confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [formData, setFormData] = useState(pet);
    // Profile pic removed - using icons instead
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isEditingAppointment, setIsEditingAppointment] = useState(false);
    const [editingAppointmentData, setEditingAppointmentData] = useState(null);
    const [isUpdatingPet, setIsUpdatingPet] = useState(false);
    const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
    const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
    const [isTogglingActive, setIsTogglingActive] = useState(false);


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
        if (isUpdatingPet) return;

        setIsUpdatingPet(true);
        try {
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
                toast.success("Pet details updated!");
                setEditMode(false);
            } else {
                toast.error("Failed to update pet details.");
            }
        } finally {
            setIsUpdatingPet(false);
        }
    };

    const handleToggleActive = async () => {
        if (isTogglingActive) return;

        setIsTogglingActive(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('active', !pet.active);

            const response = await fetch(`/pets/${pet.id}`, {
                method: "PATCH",
                body: formDataToSend,
                credentials: "include"
            });

            if (response.ok) {
                const updatedPet = await response.json();
                updatePet(updatedPet);
                toast.success(`${pet.name} marked as ${updatedPet.active ? 'active' : 'inactive'}!`);
            } else {
                toast.error("Failed to update pet status.");
            }
        } catch (error) {
            console.error("Error toggling pet status:", error);
            toast.error("An error occurred while updating pet status.");
        } finally {
            setIsTogglingActive(false);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        const confirmed = await confirm({
            title: 'Delete Appointment?',
            message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeletingAppointment(true);
        try {
            const response = await fetch(`/appointments/${appointmentId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (response.ok) {
                // Use smart update - prevents full re-render
                removeAppointment(appointmentId);
                setSelectedAppointment(null);
                toast.success("Appointment deleted successfully!");
            } else {
                toast.error("Failed to delete appointment.");
            }
        } finally {
            setIsDeletingAppointment(false);
        }
    };

    const handleUnshareAppointment = async (appointment) => {
        const activeShares = appointment.appointment_shares?.filter(share =>
            share.status === 'accepted' || share.status === 'pending'
        );

        if (!activeShares || activeShares.length === 0) {
            toast.error('No active shares found');
            return;
        }

        const confirmed = await confirm({
            title: 'Unshare Appointment?',
            message: `This will remove ${activeShares.length} active share(s). The appointment will return to your schedule only.`,
            confirmText: 'Unshare',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeletingAppointment(true);
        try {
            const token = localStorage.getItem('token');
            const deletePromises = activeShares.map(share =>
                fetch(`/appointment_shares/${share.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            );

            const results = await Promise.all(deletePromises);
            const allSuccessful = results.every(r => r.ok);

            if (allSuccessful) {
                // Update the appointment in state to remove shares
                setAppointments(prev => prev.map(apt =>
                    apt.id === appointment.id
                        ? { ...apt, appointment_shares: [], delegation_status: 'none' }
                        : apt
                ));
                setSelectedAppointment(null);
                toast.success('Appointment unshared successfully!');
            } else {
                toast.error('Failed to unshare some appointments');
            }
        } catch (error) {
            console.error('Error unsharing appointment:', error);
            toast.error('Error unsharing appointment');
        } finally {
            setIsDeletingAppointment(false);
        }
    };

    const handleUpdateAppointment = async () => {
        if (isUpdatingAppointment) return;

        setIsUpdatingAppointment(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointments/${editingAppointmentData.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointment: {
                        start_time: editingAppointmentData.start_time,
                        end_time: editingAppointmentData.end_time,
                        duration: editingAppointmentData.duration,
                        walk_type: editingAppointmentData.walk_type,
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
                toast.success("Appointment updated successfully!");
            } else {
                const error = await response.json();
                toast.error(`Error updating appointment: ${error.errors?.join(", ") || "Unknown error"}`);
            }
        } finally {
            setIsUpdatingAppointment(false);
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
            walk_type: selectedAppointment.walk_type || 'group'
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
                    <ToggleActiveButton
                        onClick={handleToggleActive}
                        disabled={isTogglingActive}
                        $active={pet.active}
                    >
                        {isTogglingActive ? (
                            <span>Updating...</span>
                        ) : pet.active ? (
                            <>
                                <Pause size={16} />
                                <span>Mark Inactive</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                <span>Mark Active</span>
                            </>
                        )}
                    </ToggleActiveButton>
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
                                        <SaveButton onClick={handleUpdate} disabled={isUpdatingPet}>
                                            <Save size={16} />
                                            {isUpdatingPet ? 'Saving...' : 'Save Changes'}
                                        </SaveButton>
                                        <CancelButton onClick={() => {
                                            setEditMode(false);
                                            setFormData(pet);
                                        }} disabled={isUpdatingPet}>
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
                                                    {apt.duration} min {apt.walk_type || 'group'} walk
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

                                            {apt.recurring && apt.appointment_shares?.some(share => share.status === 'accepted') && (
                                                <CancellationsList style={{ borderColor: '#667eea', background: 'rgba(102, 126, 234, 0.05)' }}>
                                                    <CancellationsTitle style={{ color: '#667eea' }}>Shared dates:</CancellationsTitle>
                                                    {apt.appointment_shares
                                                        .filter(share => share.status === 'accepted')
                                                        .flatMap(share => share.share_dates || [])
                                                        .slice(0, 10)
                                                        .map((dateStr, idx) => (
                                                            <CancellationDate key={idx} style={{ borderColor: '#667eea', color: '#667eea' }}>
                                                                {dayjs(dateStr).format("MMM D")}
                                                            </CancellationDate>
                                                        ))
                                                    }
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
                                                        <InfoValue>{selectedAppointment.walk_type ? selectedAppointment.walk_type.charAt(0).toUpperCase() + selectedAppointment.walk_type.slice(1) : 'Group'}</InfoValue>
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
                                                        <PrimaryButton onClick={() => setShowCancellationModal(true)} disabled={isDeletingAppointment}>
                                                            <CalendarX size={16} />
                                                            Add Cancellation
                                                        </PrimaryButton>
                                                    )}
                                                    <PrimaryButton
                                                        onClick={() => setShowShareModal(true)}
                                                        disabled={isDeletingAppointment}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        <Share2 size={16} />
                                                        Share
                                                    </PrimaryButton>
                                                    {selectedAppointment.appointment_shares?.some(share => share.status === 'accepted' || share.status === 'pending') && (
                                                        <DeleteButton
                                                            onClick={() => handleUnshareAppointment(selectedAppointment)}
                                                            disabled={isDeletingAppointment}
                                                            style={{
                                                                background: '#fb923c',
                                                                borderColor: '#f97316'
                                                            }}
                                                        >
                                                            <X size={16} />
                                                            Unshare
                                                        </DeleteButton>
                                                    )}
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
                                                            value={editingAppointmentData.walk_type}
                                                            onChange={(e) => handleAppointmentFieldChange('walk_type', e.target.value)}
                                                        >
                                                            <option value="group">Group Walk</option>
                                                            <option value="solo">Solo Walk</option>
                                                            <option value="training">Training Walk</option>
                                                            <option value="sibling">Sibling Walk</option>
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
                                                    <SaveButton onClick={handleUpdateAppointment} disabled={isUpdatingAppointment}>
                                                        <Save size={16} />
                                                        {isUpdatingAppointment ? 'Saving...' : 'Save Changes'}
                                                    </SaveButton>
                                                    <CancelButton onClick={() => {
                                                        setIsEditingAppointment(false);
                                                        setEditingAppointmentData(null);
                                                    }} disabled={isUpdatingAppointment}>
                                                        Cancel
                                                    </CancelButton>
                                                    <DeleteButton onClick={() => handleDeleteAppointment(selectedAppointment.id)} disabled={isDeletingAppointment}>
                                                        <Trash2 size={16} />
                                                        {isDeletingAppointment ? 'Deleting...' : 'Delete'}
                                                    </DeleteButton>
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

                            {showShareModal && selectedAppointment && (
                                <ShareAppointmentModal
                                    isOpen={showShareModal}
                                    appointment={selectedAppointment}
                                    onClose={() => setShowShareModal(false)}
                                    onShareSuccess={() => {
                                        setShowShareModal(false);
                                        toast.success('Appointment shared successfully!');
                                    }}
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
            {confirmState.isOpen && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onCancel={confirmState.onCancel}
                    confirmText={confirmState.confirmText}
                    cancelText={confirmState.cancelText}
                    variant={confirmState.variant}
                />
            )}
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
});

PetDetailsModal.displayName = 'PetDetailsModal';

// Styled Components
const Container = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 16px 100px;

    @media (min-width: 768px) {
        padding: 24px 20px 100px;
    }
`;

const Header = styled.div`
    width: 100%;
    max-width: 448px;
    margin: 0 auto 20px;
    z-index: 100;
    position: relative;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (min-width: 768px) {
        margin: 0 auto 24px;
    }

    @media (max-width: 768px) {
        padding: 0 12px;
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

const PageTitle = styled.h1`
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    @media (min-width: 768px) {
        font-size: 32px;
    }
`;

const PageSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const HeaderButtonGroup = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const HeaderButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
        transform: translateY(0);
    }
`;

const SearchAndFilterSection = styled.div`
    max-width: 448px;
    margin: 0 auto 20px;
`;

const AddPetButton = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.95);
    color: #22c55e;
    border: none;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);

    @media (max-width: 768px) {
        width: 100%;
        justify-content: center;
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
        background: white;
        color: #16a34a;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
    }
`;

const SearchAndFilter = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
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
    width: fit-content;

    @media (max-width: 768px) {
        gap: 5px;
        padding: 4px;
        width: 100%;
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
    max-width: 448px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 768px) {
        gap: 1.5rem;
    }
`;

const StyledPetCard = styled.div`
    background: ${props => props.$active
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)'
    };
    backdrop-filter: blur(20px);
    border: 2px solid ${props => props.$active
        ? 'rgba(255, 255, 255, 0.5)'
        : 'rgba(255, 255, 255, 0.25)'
    };
    border-radius: 20px;
    padding: 1.25rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${props => props.$active
        ? '0 8px 32px rgba(99, 102, 241, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
        : '0 4px 16px rgba(0, 0, 0, 0.1)'
    };
    opacity: ${props => props.$active ? 1 : 0.85};
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${props => props.$active
            ? 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)'
            : 'rgba(255, 255, 255, 0.3)'
        };
        opacity: ${props => props.$active ? 1 : 0};
        transition: opacity 0.3s ease;
    }

    &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: ${props => props.$active
            ? '0 12px 40px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 8px 24px rgba(0, 0, 0, 0.15)'
        };
        border-color: ${props => props.$active
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(255, 255, 255, 0.4)'
        };

        &::before {
            opacity: 1;
        }
    }

    @media (min-width: 768px) {
        padding: 1.5rem;
        gap: 1.125rem;
    }
`;

const PetIcon = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;

    svg {
        width: 24px;
        height: 24px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    @media (min-width: 768px) {
        width: 52px;
        height: 52px;

        svg {
            width: 26px;
            height: 26px;
        }
    }
`;

const ChevronIcon = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;

    svg {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }
`;

const PetCardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 4px;
    margin: -4px;
    border-radius: 14px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(2px);

        ${PetIcon} {
            transform: scale(1.05) rotate(2deg);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.3);
        }

        ${ChevronIcon} {
            color: rgba(255, 255, 255, 1);
            transform: translateX(4px);
        }
    }
`;

const PetName = styled.h3`
    flex: 1;
    font-family: 'Poppins', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.3px;

    @media (min-width: 768px) {
        font-size: 1.25rem;
    }
`;

const StatusBadge = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    background: ${props => props.$active
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))'
    };
    color: ${props => props.$active ? '#ffffff' : '#ffffff'};
    border: 2px solid ${props => props.$active
        ? 'rgba(34, 197, 94, 0.6)'
        : 'rgba(239, 68, 68, 0.6)'
    };
    flex-shrink: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: ${props => props.$active
        ? '0 2px 8px rgba(34, 197, 94, 0.3)'
        : '0 2px 8px rgba(239, 68, 68, 0.3)'
    };
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    svg {
        width: 14px;
        height: 14px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }
`;

const PetCardInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    margin: -8px;
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const QuickActionsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
`;

const QuickActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    backdrop-filter: blur(10px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    svg {
        width: 16px;
        height: 16px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    @media (min-width: 768px) {
        padding: 11px 14px;
        font-size: 0.85rem;

        svg {
            width: 17px;
            height: 17px;
        }
    }

    &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        background: linear-gradient(135deg, #5b5fc7, #7c3aed);
        border-color: rgba(255, 255, 255, 0.5);
    }

    &:active {
        transform: translateY(-1px) scale(1);
    }
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    svg {
        width: 16px;
        height: 16px;
        color: rgba(255, 255, 255, 0.8);
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    @media (min-width: 768px) {
        font-size: 0.9rem;

        svg {
            width: 17px;
            height: 17px;
        }
    }
`;

const ViewDetailsButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
    color: #ffffff;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    transition: all 0.3s ease;
    cursor: pointer;
    backdrop-filter: blur(10px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    svg {
        width: 16px;
        height: 16px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    @media (min-width: 768px) {
        font-size: 0.9rem;
        padding: 11px 14px;

        svg {
            width: 17px;
            height: 17px;
        }
    }

    &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
        border-color: rgba(255, 255, 255, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }
`;

const EmptyState = styled.div`
    max-width: 500px;
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
    margin: 0 0 0.75rem;
    color: #1f2937;
`;

const EmptyText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1.5rem;
    line-height: 1.6;
`;

const EmptyStateButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }

    &:active {
        transform: translateY(0);
    }
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
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    @media (max-width: 768px) {
        max-height: 100vh;
        height: auto;
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

const ToggleActiveButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid;
    background: ${props => props.$active
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(34, 197, 94, 0.1)'};
    color: ${props => props.$active
        ? '#ef4444'
        : '#22c55e'};
    border-color: ${props => props.$active
        ? 'rgba(239, 68, 68, 0.3)'
        : 'rgba(34, 197, 94, 0.3)'};

    &:hover:not(:disabled) {
        background: ${props => props.$active
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(34, 197, 94, 0.2)'};
        border-color: ${props => props.$active
            ? 'rgba(239, 68, 68, 0.5)'
            : 'rgba(34, 197, 94, 0.5)'};
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    svg {
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        padding: 6px 10px;
        font-size: 0.75rem;
        border: 1px solid;
        gap: 5px;

        svg {
            width: 14px;
            height: 14px;
        }
    }

    @media (max-width: 480px) {
        padding: 8px;
        gap: 0;
        border-radius: 8px;

        svg {
            width: 18px;
            height: 18px;
        }

        span {
            display: none;
        }
    }
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

const TabDescription = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 20px 0;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    border-left: 3px solid rgba(255, 255, 255, 0.4);
    line-height: 1.5;

    @media (max-width: 768px) {
        font-size: 0.85rem;
        padding: 10px 12px;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    @media (min-width: 768px) {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
`;

const SaveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    @media (min-width: 768px) {
        padding: 10px 20px;
        font-size: 0.95rem;

        svg {
            width: 16px;
            height: 16px;
        }
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const CancelButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    background: #f3f4f6;
    color: #666;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    @media (min-width: 768px) {
        padding: 10px 20px;
        font-size: 0.95rem;
    }

    &:hover:not(:disabled) {
        background: #e5e7eb;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    @media (min-width: 768px) {
        padding: 10px 20px;
        font-size: 0.95rem;

        svg {
            width: 16px;
            height: 16px;
        }
    }

    &:hover:not(:disabled) {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 2px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    @media (min-width: 768px) {
        padding: 10px 20px;
        font-size: 0.95rem;

        svg {
            width: 16px;
            height: 16px;
        }
    }

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 24px;

    @media (min-width: 768px) {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
`;

const CreatePetModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 999999;
    padding: 20px;
`;

const CreatePetModalContent = styled.div`
    width: 100%;
    max-width: 600px;
`;

export {
    Container,
    Header,
    HeaderContent,
    PageTitle,
    PageSubtitle,
    HeaderButtonGroup,
    HeaderButton,
    AddPetButton,
    SearchAndFilter,
    SearchBar,
    FilterTabs,
    FilterTab,
    PetsGrid,
    StyledPetCard,
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