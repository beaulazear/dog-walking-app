import React, { useContext, useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import { 
    Calendar, 
    Clock, 
    CheckCircle, 
    X, 
    Dog, 
    Users, 
    User,
    CalendarDays,
    Heart,
    DollarSign,
    Plus,
    Minus,
    Info,
    MapPin,
    Phone,
    Mail,
    Cake
} from "lucide-react";

export default function TodaysWalks() {
    const { user } = useContext(UserContext);

    const todaysAppointments = (user?.appointments
        ?.filter(appointment => {
            if (appointment.canceled) return false;

            const todayFormatted = dayjs().format("YYYY-MM-DD");

            const hasCancellationToday = appointment.cancellations?.some(cancellation =>
                dayjs(cancellation.date).format("YYYY-MM-DD") === todayFormatted
            );

            if (appointment.recurring) {
                return appointment[dayjs().format("dddd").toLowerCase()] && !hasCancellationToday;
            }

            return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === todayFormatted;
        })
        ?.sort((a, b) => {
            const startA = dayjs(a.start_time, "HH:mm");
            const startB = dayjs(b.start_time, "HH:mm");
            const endA = dayjs(a.end_time, "HH:mm");
            const endB = dayjs(b.end_time, "HH:mm");

            if (startA.isBefore(startB)) return -1;
            if (startA.isAfter(startB)) return 1;

            return endA.isBefore(endB) ? -1 : 1;
        }) || []);

    return (
        <Container>
            <HeaderSection>
                <TitleSection>
                    <Title>
                        <CalendarDays size={32} />
                        Today's Walks
                    </Title>
                    <Subtitle>{dayjs().format("MMMM D, YYYY")}</Subtitle>
                    <SummaryText>
                        <Heart size={16} />
                        {todaysAppointments.length} {todaysAppointments.length === 1 ? 'walk' : 'walks'} scheduled
                    </SummaryText>
                </TitleSection>
            </HeaderSection>

            {todaysAppointments.length === 0 ? (
                <EmptyState>
                    <EmptyIcon>
                        <Dog size={48} />
                    </EmptyIcon>
                    <EmptyTitle>No walks scheduled</EmptyTitle>
                    <EmptyText>Enjoy your free day! Your furry friends are taking a rest.</EmptyText>
                </EmptyState>
            ) : (
                <WalkList>
                    {todaysAppointments.map(appointment => (
                        <WalkCard key={appointment.id} appointment={appointment} />
                    ))}
                </WalkList>
            )}
        </Container>
    );
}

const hasInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && !invoice.cancelled;
    });
};

const hasCancelledInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && invoice.cancelled;
    });
};

const WalkCard = ({ appointment }) => {
    const { user, setUser } = useContext(UserContext);
    const [isCompleted, setIsCompleted] = useState(
        hasInvoiceForToday(appointment, user?.invoices)
    );
    const [isCancelled, setIsCancelled] = useState(
        hasCancelledInvoiceForToday(appointment, user?.invoices)
    );
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showPetModal, setShowPetModal] = useState(false);

    const handleCompleteWalk = async (offset = 0) => {
        let compensation = appointment.duration === 30 ? user.thirty 
            : appointment.duration === 40 ? user.fourty 
            : appointment.duration === 60 ? user.sixty 
            : 0;
    
        compensation += offset;
    
        const response = await fetch("/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pet_id: appointment.pet.id,
                appointment_id: appointment.id,
                date_completed: dayjs().toISOString(),
                paid: false,
                compensation,
                title: `${appointment.duration} min walk`
            }),
        });
    
        if (response.ok) {
            const newInvoice = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                invoices: [...prevUser.invoices, newInvoice]
            }));
            setIsCompleted(true);
            setShowCompletionModal(false);
        }
    };

    const handleCancelWalk = async () => {
        const cancellationFee = prompt("Enter a cancellation fee (or leave blank for $0):", "0");
        if (cancellationFee === null) return;

        const response = await fetch("/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pet_id: appointment.pet.id,
                appointment_id: appointment.id,
                date_completed: dayjs().toISOString(),
                paid: false,
                compensation: parseFloat(cancellationFee) || 0,
                title: `Canceled ${appointment.duration} min walk`,
                cancelled: true
            }),
        });

        if (response.ok) {
            const newInvoice = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                invoices: [...prevUser.invoices, newInvoice]
            }));
            setIsCancelled(true)
        }
    };

    return (
        <Card $completed={isCompleted} $cancelled={isCancelled}>
            <PetImageContainer onClick={() => setShowPetModal(true)}>
                <PetImage
                    src={appointment.pet?.profile_pic || dogPlaceholder}
                    onError={(e) => (e.target.src = dogPlaceholder)}
                    alt={appointment.pet?.name}
                />
            </PetImageContainer>
            
            <WalkDetails>
                <PetName>{appointment.pet?.name}</PetName>
                <WalkInfo>
                    <InfoItem>
                        <Clock size={14} />
                        {appointment.duration} min
                    </InfoItem>
                    <InfoItem>
                        {appointment.solo ? <User size={14} /> : <Users size={14} />}
                        {appointment.solo ? 'Solo' : 'Group'} walk
                    </InfoItem>
                </WalkInfo>
                <TimeRange>
                    <Calendar size={14} />
                    {dayjs(appointment.start_time).format("h:mm A")} - {dayjs(appointment.end_time).format("h:mm A")}
                </TimeRange>
            </WalkDetails>

            {!isCompleted && !isCancelled && (
                <ButtonContainer>
                    <CompleteButton onClick={() => setShowCompletionModal(true)}>
                        <CheckCircle size={16} />
                        Complete
                    </CompleteButton>
                    <CancelButton onClick={handleCancelWalk}>
                        <X size={16} />
                        Cancel
                    </CancelButton>
                </ButtonContainer>
            )}
            
            {showCompletionModal && (
                <CompletionModal 
                    appointment={appointment}
                    user={user}
                    onComplete={handleCompleteWalk}
                    onClose={() => setShowCompletionModal(false)}
                />
            )}

            {showPetModal && (
                <PetDetailsModal 
                    pet={appointment.pet}
                    onClose={() => setShowPetModal(false)}
                />
            )}
            
            {isCompleted && (
                <StatusTag $completed>
                    <CheckCircle size={16} />
                    Completed
                </StatusTag>
            )}
            {isCancelled && (
                <StatusTag $cancelled>
                    <X size={16} />
                    Cancelled
                </StatusTag>
            )}
        </Card>
    );
};

// Completion Modal Component
const CompletionModal = ({ appointment, user, onComplete, onClose }) => {
    const [offset, setOffset] = useState(0);
    const [offsetType, setOffsetType] = useState('upcharge');
    
    const baseCompensation = appointment.duration === 30 ? user.thirty 
        : appointment.duration === 40 ? user.fourty 
        : appointment.duration === 60 ? user.sixty 
        : 0;
    
    const finalAmount = baseCompensation + (offsetType === 'upcharge' ? offset : -offset);

    const handleSubmit = () => {
        const finalOffset = offsetType === 'upcharge' ? offset : -offset;
        onComplete(finalOffset);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const modalContent = (
        <CompletionModalOverlay onClick={handleOverlayClick}>
            <CompletionModalContainer>
                <CompletionModalHeader>
                    <CompletionModalTitle>
                        <CheckCircle size={24} />
                        Complete Walk
                    </CompletionModalTitle>
                    <CompletionModalCloseButton onClick={onClose}>
                        <X size={18} />
                    </CompletionModalCloseButton>
                </CompletionModalHeader>
                
                <CompletionModalContent>
                    <WalkSummary>
                        <PetInfo>
                            <PetAvatar
                                src={appointment.pet?.profile_pic || dogPlaceholder}
                                onError={(e) => (e.target.src = dogPlaceholder)}
                                alt={appointment.pet?.name}
                            />
                            <div>
                                <PetNameText>{appointment.pet?.name}</PetNameText>
                                <WalkInfoText>
                                    {appointment.duration} min • {appointment.solo ? 'Solo' : 'Group'} walk
                                </WalkInfoText>
                            </div>
                        </PetInfo>
                        
                        <CompensationSummary>
                            <BaseRate>
                                <DollarSign size={16} />
                                Base Rate: ${baseCompensation.toFixed(2)}
                            </BaseRate>
                        </CompensationSummary>
                    </WalkSummary>

                    <AdjustmentSection>
                        <SectionTitle>Adjustments (Optional)</SectionTitle>
                        
                        <AdjustmentControls>
                            <TypeSelector>
                                <TypeButton 
                                    $active={offsetType === 'upcharge'} 
                                    onClick={() => setOffsetType('upcharge')}
                                >
                                    <Plus size={14} />
                                    Upcharge
                                </TypeButton>
                                <TypeButton 
                                    $active={offsetType === 'discount'} 
                                    onClick={() => setOffsetType('discount')}
                                >
                                    <Minus size={14} />
                                    Discount
                                </TypeButton>
                            </TypeSelector>
                            
                            <AmountInput>
                                <DollarSign size={16} />
                                <input
                                    type="number"
                                    value={offset}
                                    onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </AmountInput>
                        </AdjustmentControls>
                    </AdjustmentSection>

                    <FinalTotal $positive={finalAmount >= 0}>
                        <DollarSign size={20} />
                        Total: ${finalAmount.toFixed(2)}
                    </FinalTotal>

                    <ModalButtonGroup>
                        <ConfirmButton onClick={handleSubmit}>
                            <CheckCircle size={16} />
                            Complete & Create Invoice
                        </ConfirmButton>
                        <CancelModalButton onClick={onClose}>
                            <X size={16} />
                            Cancel
                        </CancelModalButton>
                    </ModalButtonGroup>
                </CompletionModalContent>
            </CompletionModalContainer>
        </CompletionModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Pet Details Modal Component
const PetDetailsModal = ({ pet, onClose }) => {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const calculateAge = (birthdate) => {
        if (!birthdate) return 'Unknown';
        const today = dayjs();
        const birth = dayjs(birthdate);
        const years = today.diff(birth, 'year');
        const months = today.diff(birth.add(years, 'year'), 'month');
        
        if (years === 0) {
            return months === 1 ? '1 month old' : `${months} months old`;
        }
        return years === 1 ? '1 year old' : `${years} years old`;
    };

    const modalContent = (
        <PetModalOverlay onClick={handleOverlayClick}>
            <PetModalContainer>
                <PetModalHeader>
                    <PetModalTitle>
                        <Info size={24} />
                        Pet Details
                    </PetModalTitle>
                    <PetModalCloseButton onClick={onClose}>
                        <X size={18} />
                    </PetModalCloseButton>
                </PetModalHeader>
                
                <PetModalContent>
                    <PetMainInfo>
                        <PetModalAvatar
                            src={pet?.profile_pic || dogPlaceholder}
                            onError={(e) => (e.target.src = dogPlaceholder)}
                            alt={pet?.name}
                        />
                        <PetNameContainer>
                            <PetModalName>{pet?.name || 'Unknown'}</PetModalName>
                            <PetBreed>{pet?.breed || 'Mixed Breed'}</PetBreed>
                        </PetNameContainer>
                    </PetMainInfo>

                    <PetDetailsGrid>
                        <PetDetailItem>
                            <DetailIcon>
                                <Cake size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Age</DetailLabel>
                                <DetailValue>{calculateAge(pet?.birthdate)}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        <PetDetailItem>
                            <DetailIcon>
                                <User size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Sex</DetailLabel>
                                <DetailValue>{pet?.sex || 'Not specified'}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        <PetDetailItem>
                            <DetailIcon>
                                <Dog size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Size</DetailLabel>
                                <DetailValue>{pet?.size || 'Not specified'}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        {pet?.owner && (
                            <>
                                <PetDetailItem>
                                    <DetailIcon>
                                        <Users size={18} />
                                    </DetailIcon>
                                    <DetailContent>
                                        <DetailLabel>Owner</DetailLabel>
                                        <DetailValue>{pet.owner.name || 'Not specified'}</DetailValue>
                                    </DetailContent>
                                </PetDetailItem>

                                {pet.owner.email && (
                                    <PetDetailItem>
                                        <DetailIcon>
                                            <Mail size={18} />
                                        </DetailIcon>
                                        <DetailContent>
                                            <DetailLabel>Email</DetailLabel>
                                            <DetailValue>{pet.owner.email}</DetailValue>
                                        </DetailContent>
                                    </PetDetailItem>
                                )}

                                {pet.owner.phone && (
                                    <PetDetailItem>
                                        <DetailIcon>
                                            <Phone size={18} />
                                        </DetailIcon>
                                        <DetailContent>
                                            <DetailLabel>Phone</DetailLabel>
                                            <DetailValue>{pet.owner.phone}</DetailValue>
                                        </DetailContent>
                                    </PetDetailItem>
                                )}

                                {pet.owner.address && (
                                    <PetDetailItem>
                                        <DetailIcon>
                                            <MapPin size={18} />
                                        </DetailIcon>
                                        <DetailContent>
                                            <DetailLabel>Address</DetailLabel>
                                            <DetailValue>{pet.owner.address}</DetailValue>
                                        </DetailContent>
                                    </PetDetailItem>
                                )}
                            </>
                        )}
                    </PetDetailsGrid>

                    {pet?.notes && (
                        <NotesSection>
                            <NotesTitle>Additional Notes</NotesTitle>
                            <NotesText>{pet.notes}</NotesText>
                        </NotesSection>
                    )}
                </PetModalContent>
            </PetModalContainer>
        </PetModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Main container with matching gradient background
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

// Header section styling
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

const Subtitle = styled.h2`
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

const SummaryText = styled.p`
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

// Empty state styling
const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.8), rgba(107, 43, 107, 0.6));
    border-radius: 24px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    
    @media (max-width: 768px) {
        padding: 40px 24px;
        border-radius: 20px;
    }
`;

const EmptyIcon = styled.div`
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
`;

const EmptyTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const EmptyText = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    max-width: 350px;
    line-height: 1.5;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

// Walk list styling
const WalkList = styled.div`
    width: 100%;
    max-width: 800px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

// Walk card styling
const Card = styled.div`
    background: ${({ $completed, $cancelled }) =>
        $completed ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.8))' :
        $cancelled ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.8))' :
        'linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8))'
    };
    padding: 16px 20px;
    border-radius: 16px;
    border: 2px solid ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(34, 197, 94, 0.4)' :
        $cancelled ? 'rgba(239, 68, 68, 0.4)' :
        'rgba(139, 90, 140, 0.4)'
    };
    backdrop-filter: blur(15px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
    min-height: 80px;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        border-color: ${({ $completed, $cancelled }) =>
            $completed ? 'rgba(34, 197, 94, 0.6)' :
            $cancelled ? 'rgba(239, 68, 68, 0.6)' :
            '#a569a7'
        };
    }
    
    @media (max-width: 768px) {
        padding: 14px 18px;
        border-radius: 14px;
        gap: 12px;
        min-height: 70px;
    }
    
    @media (max-width: 480px) {
        padding: 12px 16px;
        gap: 10px;
        min-height: 60px;
    }
`;

const PetImageContainer = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.05);
    }
`;

const PetImage = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    
    @media (max-width: 768px) {
        width: 40px;
        height: 40px;
    }
    
    @media (max-width: 480px) {
        width: 36px;
        height: 36px;
    }
`;

const WalkDetails = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    min-width: 0; /* Allow text to wrap/truncate */
`;

const PetName = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    @media (max-width: 768px) {
        font-size: 1rem;
    }
    
    @media (max-width: 480px) {
        font-size: 0.95rem;
    }
`;

const WalkInfo = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    
    @media (max-width: 480px) {
        gap: 8px;
    }
`;

const InfoItem = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const TimeRange = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
`;

const CompleteButton = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.3s ease;
    box-shadow: 0 3px 12px rgba(34, 197, 94, 0.3);
    min-width: 90px;
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 6px 8px;
        font-size: 0.75rem;
        min-width: 70px;
    }
    
    @media (max-width: 480px) {
        padding: 5px 6px;
        font-size: 0.7rem;
        min-width: 60px;
    }
`;

const CancelButton = styled.button`
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #ffffff;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.3s ease;
    box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
    min-width: 90px;
    
    &:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 6px 8px;
        font-size: 0.75rem;
        min-width: 70px;
    }
    
    @media (max-width: 480px) {
        padding: 5px 6px;
        font-size: 0.7rem;
        min-width: 60px;
    }
`;

const StatusTag = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    
    background: ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(34, 197, 94, 0.3)' :
        $cancelled ? 'rgba(239, 68, 68, 0.3)' :
        'rgba(255, 255, 255, 0.2)'
    };
    border: 2px solid ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(34, 197, 94, 0.5)' :
        $cancelled ? 'rgba(239, 68, 68, 0.5)' :
        'rgba(255, 255, 255, 0.3)'
    };
    color: #ffffff;
    
    @media (max-width: 768px) {
        padding: 6px 10px;
        font-size: 0.75rem;
        gap: 3px;
    }
    
    @media (max-width: 480px) {
        padding: 5px 8px;
        font-size: 0.7rem;
        gap: 2px;
    }
`;

// Completion Modal Styled Components
const CompletionModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
    padding: 20px;
`;

const CompletionModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 24px;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
`;

const CompletionModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 20px;
`;

const CompletionModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CompletionModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.1);
    }
`;

const CompletionModalContent = styled.div`
    padding: 0 24px 24px;
`;

const WalkSummary = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const PetInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
`;

const PetAvatar = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
`;

const PetNameText = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 4px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const WalkInfoText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-weight: 500;
`;

const CompensationSummary = styled.div`
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 16px;
`;

const BaseRate = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const AdjustmentSection = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const AdjustmentControls = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const TypeSelector = styled.div`
    display: flex;
    gap: 8px;
`;

const TypeButton = styled.button`
    flex: 1;
    background: ${({ $active }) => 
        $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'rgba(255, 255, 255, 0.1)'
    };
    border: 2px solid ${({ $active }) => 
        $active ? '#a569a7' : 'rgba(255, 255, 255, 0.2)'
    };
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    
    &:hover {
        background: ${({ $active }) => 
            $active ? 'linear-gradient(135deg, #8b5a8c, #76517a)' : 'rgba(255, 255, 255, 0.15)'
        };
        transform: translateY(-1px);
    }
`;

const AmountInput = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    
    svg {
        position: absolute;
        left: 12px;
        color: rgba(255, 255, 255, 0.7);
        z-index: 1;
    }
    
    input {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 12px 16px 12px 44px;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        
        &::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        &:focus {
            outline: none;
            border-color: #a569a7;
            background: rgba(255, 255, 255, 0.15);
        }
    }
`;

const FinalTotal = styled.div`
    background: ${({ $positive }) => 
        $positive ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    box-shadow: 0 8px 32px ${({ $positive }) => 
        $positive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    };
`;

const ModalButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

const ConfirmButton = styled.button`
    flex: 1;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 14px;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 24px rgba(34, 197, 94, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
    }
`;

const CancelModalButton = styled.button`
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
`;

// Pet Details Modal Styled Components
const PetModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10003;
    padding: 20px;
`;

const PetModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 24px;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
`;

const PetModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 20px;
`;

const PetModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PetModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.1);
    }
`;

const PetModalContent = styled.div`
    padding: 0 24px 24px;
`;

const PetMainInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const PetModalAvatar = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const PetNameContainer = styled.div`
    flex: 1;
`;

const PetModalName = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PetBreed = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-weight: 500;
    font-style: italic;
`;

const PetDetailsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
`;

const PetDetailItem = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
    }
`;

const DetailIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(165, 105, 167, 0.3);
    border-radius: 50%;
    color: #ffffff;
    flex-shrink: 0;
`;

const DetailContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const DetailLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
`;

const DetailValue = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #ffffff;
    word-break: break-word;
`;

const NotesSection = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.12);
`;

const NotesTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const NotesText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.6;
    font-weight: 400;
`;