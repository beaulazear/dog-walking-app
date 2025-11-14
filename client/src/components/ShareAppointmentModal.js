import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import styled, { keyframes } from "styled-components";
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { X, Share2, Users, DollarSign, CheckSquare, Calendar, Clock, Dog, AlertCircle } from "lucide-react";
import { UserContext } from "../context/user";

export default function ShareAppointmentModal({ isOpen, onClose, appointment, appointments = [], onShareSuccess }) {
    const { user } = useContext(UserContext);
    const [connections, setConnections] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [coveringPercentage, setCoveringPercentage] = useState(60);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isSharing, setIsSharing] = useState(false);
    const [walkPrice, setWalkPrice] = useState(0);

    const isSingleAppointment = appointment && !appointments.length;
    const appointmentsToShare = isSingleAppointment ? [appointment] : appointments;
    const currentAppointment = appointmentsToShare[0];

    // Calculate default price based on user rates
    const calculateDefaultPrice = () => {
        if (!currentAppointment || !user) return 0;

        const duration = currentAppointment.duration;
        const walkType = currentAppointment.walk_type;

        // Get base price by duration
        let basePrice = 0;
        if (duration === 30) basePrice = user.thirty || 0;
        else if (duration === 45) basePrice = user.fortyfive || 0;
        else if (duration === 60) basePrice = user.sixty || 0;

        // Adjust for walk type
        if (walkType === 'solo') return user.solo_rate || basePrice;
        if (walkType === 'training') return user.training_rate || basePrice;
        if (walkType === 'sibling') return user.sibling_rate || basePrice;

        return basePrice;
    };

    useEffect(() => {
        if (isOpen) {
            fetchConnections();
            setSelectedDates([]);
            // Set initial walk price (convert from dollars to cents if needed)
            const defaultPrice = currentAppointment?.price || (calculateDefaultPrice() * 100);
            setWalkPrice(defaultPrice);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchConnections = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/walker_connections", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const accepted = data.filter(c => c.status === "accepted");
                setConnections(accepted);
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const generateAvailableDates = () => {
        if (!currentAppointment?.recurring) return [];

        const dates = [];
        const today = dayjs();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const appointmentDays = daysOfWeek.filter(day => currentAppointment[day]);

        let currentDate = today;
        let count = 0;
        while (count < 30) {
            const dayName = daysOfWeek[currentDate.day()];
            if (appointmentDays.includes(dayName)) {
                dates.push(currentDate.format('YYYY-MM-DD'));
                count++;
            }
            currentDate = currentDate.add(1, 'day');
        }

        return dates;
    };

    const availableDates = generateAvailableDates();

    const toggleDateInMultiSelect = (date) => {
        if (selectedDates.includes(date)) {
            setSelectedDates(selectedDates.filter(d => d !== date));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    const calculateSplit = () => {
        const total = walkPrice || 0;
        const coveringAmount = Math.round(total * coveringPercentage / 100);
        return {
            covering: coveringAmount,
            original: total - coveringAmount
        };
    };

    const handleShare = async () => {
        if (!selectedUserId) {
            toast.error("Please select a team member");
            return;
        }
        if (currentAppointment?.recurring && availableDates.length > 0 && selectedDates.length === 0) {
            toast.error("Please select at least one date to share");
            return;
        }
        if (currentAppointment?.recurring && availableDates.length === 0) {
            toast.error("This recurring appointment has no days set. Please edit the appointment first.");
            return;
        }

        setIsSharing(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/appointment_shares", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointment_share: {
                        appointment_ids: appointmentsToShare.map(a => a.id),
                        shared_with_user_id: selectedUserId,
                        covering_walker_percentage: coveringPercentage,
                        share_dates: currentAppointment?.recurring ? selectedDates : []
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                if (onShareSuccess) onShareSuccess();
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to share appointment");
            }
        } catch (error) {
            console.error("Error sharing appointment:", error);
            toast.error("Error sharing appointment");
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    const split = calculateSplit();
    const selectedConnection = connections.find(c => c.other_user.id === selectedUserId);
    const hasRecurringAppointments = appointmentsToShare.some(apt => apt.recurring);

    const modalContent = (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <Header>
                    <HeaderContent>
                        <IconWrapper>
                            <Share2 size={24} />
                        </IconWrapper>
                        <HeaderText>
                            <HeaderTitle>Share Appointment</HeaderTitle>
                            <HeaderSubtitle>Collaborate with your team</HeaderSubtitle>
                        </HeaderText>
                    </HeaderContent>
                    <CloseButton onClick={onClose}>
                        <X size={20} />
                    </CloseButton>
                </Header>

                <Body>
                    {/* Appointment Details Card */}
                    <AppointmentCard>
                        <CardLabel>
                            <Dog size={16} />
                            Appointment Details
                        </CardLabel>
                        {appointmentsToShare.length === 1 ? (
                            <AppointmentDetails>
                                <DetailRow>
                                    <DetailLabel>Pet</DetailLabel>
                                    <DetailValue>{currentAppointment.pet?.name || 'Unknown'}</DetailValue>
                                </DetailRow>
                                <DetailRow>
                                    <DetailLabel>Time</DetailLabel>
                                    <DetailValue>
                                        <Clock size={14} />
                                        {currentAppointment.start_time} - {currentAppointment.end_time}
                                    </DetailValue>
                                </DetailRow>
                                <DetailRow>
                                    <DetailLabel>Price</DetailLabel>
                                    <DetailValue>${(currentAppointment.price / 100).toFixed(2)}</DetailValue>
                                </DetailRow>
                                {currentAppointment.recurring && (
                                    <RecurringTag>
                                        <Calendar size={14} />
                                        Recurring Appointment
                                    </RecurringTag>
                                )}
                            </AppointmentDetails>
                        ) : (
                            <AppointmentDetails>
                                <DetailValue>{appointmentsToShare.length} appointments selected</DetailValue>
                            </AppointmentDetails>
                        )}
                    </AppointmentCard>

                    {/* Recurring Info */}
                    {hasRecurringAppointments && (
                        <InfoAlert>
                            <AlertCircle size={20} />
                            <AlertText>
                                <AlertTitle>Select Specific Dates</AlertTitle>
                                <AlertDescription>
                                    Choose which dates to share. Each becomes a separate walk for your team member.
                                </AlertDescription>
                            </AlertText>
                        </InfoAlert>
                    )}

                    {/* Team Member Selection */}
                    {connections.length === 0 ? (
                        <EmptyState>
                            <Users size={48} />
                            <EmptyTitle>No Team Members</EmptyTitle>
                            <EmptyText>Add connections in the Team page to start sharing</EmptyText>
                        </EmptyState>
                    ) : (
                        <>
                            <Section>
                                <SectionTitle>
                                    <Users size={18} />
                                    Select Team Member
                                </SectionTitle>
                                <TeamMemberGrid>
                                    {connections.map(connection => (
                                        <TeamMemberCard
                                            key={connection.id}
                                            $selected={selectedUserId === connection.other_user.id}
                                            onClick={() => setSelectedUserId(connection.other_user.id)}
                                        >
                                            <MemberAvatar>
                                                {connection.other_user.name.charAt(0).toUpperCase()}
                                            </MemberAvatar>
                                            <MemberInfo>
                                                <MemberName>{connection.other_user.name}</MemberName>
                                                <MemberUsername>@{connection.other_user.username}</MemberUsername>
                                            </MemberInfo>
                                            {selectedUserId === connection.other_user.id && (
                                                <SelectedIndicator>
                                                    <CheckSquare size={20} />
                                                </SelectedIndicator>
                                            )}
                                        </TeamMemberCard>
                                    ))}
                                </TeamMemberGrid>
                            </Section>

                            {/* Date Selection for Recurring */}
                            {hasRecurringAppointments && (
                                <Section>
                                    <SectionTitle>
                                        <Calendar size={18} />
                                        Select Dates ({selectedDates.length} selected)
                                    </SectionTitle>
                                    {availableDates.length > 0 ? (
                                        <DateGrid>
                                            {availableDates.map(date => (
                                                <DateButton
                                                    key={date}
                                                    $selected={selectedDates.includes(date)}
                                                    onClick={() => toggleDateInMultiSelect(date)}
                                                >
                                                    <DateDay>{dayjs(date).format('ddd')}</DateDay>
                                                    <DateNum>{dayjs(date).format('MMM D')}</DateNum>
                                                </DateButton>
                                            ))}
                                        </DateGrid>
                                    ) : (
                                        <InfoAlert style={{ marginTop: '12px' }}>
                                            <AlertCircle size={20} />
                                            <AlertText>
                                                No recurring days are set for this appointment. Please edit the appointment to set which days it repeats on.
                                            </AlertText>
                                        </InfoAlert>
                                    )}
                                </Section>
                            )}

                            {/* Income Split */}
                            <Section>
                                <SectionTitle>
                                    <DollarSign size={18} />
                                    Income Split
                                </SectionTitle>

                                <PriceInputWrapper>
                                    <PriceLabel>Walk Price</PriceLabel>
                                    <PriceInputContainer>
                                        <DollarPrefix>$</DollarPrefix>
                                        <PriceInput
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={(walkPrice / 100).toFixed(2)}
                                            onChange={(e) => {
                                                const dollars = parseFloat(e.target.value) || 0;
                                                setWalkPrice(Math.round(dollars * 100));
                                            }}
                                        />
                                    </PriceInputContainer>
                                </PriceInputWrapper>

                                <SplitPreview>
                                    <SplitCard>
                                        <SplitLabel>{selectedConnection?.other_user.name || 'Team Member'}</SplitLabel>
                                        <SplitAmount>${(split.covering / 100).toFixed(2)}</SplitAmount>
                                        <SplitPercent>{coveringPercentage}%</SplitPercent>
                                    </SplitCard>
                                    <SplitDivider>
                                        <DividerLine />
                                        <DividerText>of</DividerText>
                                        <DividerLine />
                                    </SplitDivider>
                                    <SplitCard>
                                        <SplitLabel>You Keep</SplitLabel>
                                        <SplitAmount>${(split.original / 100).toFixed(2)}</SplitAmount>
                                        <SplitPercent>{100 - coveringPercentage}%</SplitPercent>
                                    </SplitCard>
                                </SplitPreview>

                                <SliderWrapper>
                                    <SliderLabels>
                                        <SliderLabel>0%</SliderLabel>
                                        <SliderLabel>50%</SliderLabel>
                                        <SliderLabel>100%</SliderLabel>
                                    </SliderLabels>
                                    <Slider
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={coveringPercentage}
                                        onChange={(e) => setCoveringPercentage(parseInt(e.target.value))}
                                    />
                                    <SliderValue>{coveringPercentage}% to team member</SliderValue>
                                </SliderWrapper>
                            </Section>
                        </>
                    )}
                </Body>

                {/* Footer */}
                {connections.length > 0 && (
                    <Footer>
                        <CancelButton onClick={onClose}>Cancel</CancelButton>
                        <ShareButton
                            onClick={handleShare}
                            disabled={
                                !selectedUserId ||
                                isSharing ||
                                (hasRecurringAppointments && availableDates.length === 0) ||
                                (hasRecurringAppointments && availableDates.length > 0 && selectedDates.length === 0)
                            }
                        >
                            {isSharing ? (
                                <>
                                    <Spinner />
                                    Sharing...
                                </>
                            ) : hasRecurringAppointments ? (
                                `Share ${selectedDates.length || 0} Date${selectedDates.length !== 1 ? 's' : ''}`
                            ) : (
                                <>
                                    <Share2 size={18} />
                                    Share Appointment
                                </>
                            )}
                        </ShareButton>
                    </Footer>
                )}
            </ModalContainer>
        </Overlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

// Animations
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Styled Components
const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    animation: ${fadeIn} 0.2s ease;
`;

const ModalContainer = styled.div`
    background: white;
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: ${slideUp} 0.3s ease;
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
`;

const HeaderContent = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const IconWrapper = styled.div`
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
`;

const HeaderText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const HeaderTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    margin: 0;
`;

const HeaderSubtitle = styled.p`
    font-size: 13px;
    margin: 0;
    opacity: 0.9;
`;

const CloseButton = styled.button`
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
`;

const Body = styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;
`;

const AppointmentCard = styled.div`
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
    border: 2px solid #e0e7ff;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
`;

const CardLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;

    svg {
        width: 16px;
        height: 16px;
    }
`;

const AppointmentDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const DetailLabel = styled.div`
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
`;

const DetailValue = styled.div`
    font-size: 14px;
    color: #1f2937;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;

    svg {
        width: 14px;
        height: 14px;
        color: #667eea;
    }
`;

const RecurringTag = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    width: fit-content;

    svg {
        width: 14px;
        height: 14px;
    }
`;

const InfoAlert = styled.div`
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #f0f9ff;
    border: 2px solid #0ea5e9;
    border-radius: 12px;
    margin-bottom: 20px;
    color: #0369a1;
`;

const AlertText = styled.div`
    flex: 1;
`;

const AlertTitle = styled.div`
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 4px;
`;

const AlertDescription = styled.div`
    font-size: 13px;
    opacity: 0.9;
    line-height: 1.5;
`;

const Section = styled.div`
    margin-bottom: 28px;
`;

const SectionTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 16px;

    svg {
        color: #667eea;
    }
`;

const TeamMemberGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
`;

const TeamMemberCard = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: ${props => props.$selected
        ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
        : '#f9fafb'
    };
    border: 2px solid ${props => props.$selected ? '#667eea' : '#e5e7eb'};
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #667eea;
        background: ${props => props.$selected
            ? 'linear-gradient(135deg, #667eea25 0%, #764ba225 100%)'
            : '#f3f4f6'
        };
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
`;

const MemberAvatar = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 20px;
    flex-shrink: 0;
`;

const MemberInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const MemberName = styled.div`
    font-weight: 600;
    font-size: 15px;
    color: #1f2937;
    margin-bottom: 2px;
`;

const MemberUsername = styled.div`
    font-size: 13px;
    color: #6b7280;
`;

const SelectedIndicator = styled.div`
    color: #667eea;
    flex-shrink: 0;
`;

const DateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
    max-height: 250px;
    overflow-y: auto;
    padding: 4px;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #667eea;
        border-radius: 10px;
    }
`;

const DateButton = styled.button`
    padding: 12px 8px;
    background: ${props => props.$selected
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'white'
    };
    color: ${props => props.$selected ? 'white' : '#1f2937'};
    border: 2px solid ${props => props.$selected ? '#667eea' : '#e5e7eb'};
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    &:hover {
        border-color: #667eea;
        background: ${props => props.$selected
            ? 'linear-gradient(135deg, #5568d3 0%, #6b3fa0 100%)'
            : '#f0f4ff'
        };
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
    }
`;

const DateDay = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    opacity: ${props => props.$selected ? 1 : 0.6};
`;

const DateNum = styled.div`
    font-size: 13px;
    font-weight: 700;
`;

const PriceInputWrapper = styled.div`
    margin-bottom: 20px;
`;

const PriceLabel = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
`;

const PriceInputContainer = styled.div`
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px 16px;
    transition: all 0.2s ease;

    &:focus-within {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
`;

const DollarPrefix = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: #6b7280;
    margin-right: 8px;
`;

const PriceInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    font-family: 'Poppins', sans-serif;

    &::placeholder {
        color: #9ca3af;
    }

    /* Remove number input arrows */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    &[type=number] {
        -moz-appearance: textfield;
    }
`;

const SplitPreview = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    margin-bottom: 20px;
`;

const SplitCard = styled.div`
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 2px solid #86efac;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
`;

const SplitLabel = styled.div`
    font-size: 12px;
    color: #166534;
    font-weight: 600;
    margin-bottom: 8px;
`;

const SplitAmount = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #15803d;
    margin-bottom: 4px;
`;

const SplitPercent = styled.div`
    font-size: 14px;
    color: #16a34a;
    font-weight: 600;
`;

const SplitDivider = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

const DividerLine = styled.div`
    width: 2px;
    flex: 1;
    background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
`;

const DividerText = styled.div`
    font-size: 11px;
    color: #9ca3af;
    font-weight: 600;
    text-transform: uppercase;
`;

const SliderWrapper = styled.div`
    background: #f9fafb;
    border-radius: 12px;
    padding: 20px;
`;

const SliderLabels = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const SliderLabel = styled.div`
    font-size: 11px;
    color: #9ca3af;
    font-weight: 600;
`;

const Slider = styled.input`
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(
        to right,
        #667eea 0%,
        #667eea ${props => props.value}%,
        #e5e7eb ${props => props.value}%,
        #e5e7eb 100%
    );
    outline: none;
    -webkit-appearance: none;
    margin-bottom: 12px;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #667eea;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        transition: all 0.2s;

        &:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    }

    &::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #667eea;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
`;

const SliderValue = styled.div`
    text-align: center;
    font-size: 13px;
    color: #667eea;
    font-weight: 700;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: #9ca3af;

    svg {
        margin-bottom: 16px;
    }
`;

const EmptyTitle = styled.div`
    font-size: 18px;
    font-weight: 700;
    color: #6b7280;
    margin-bottom: 8px;
`;

const EmptyText = styled.div`
    font-size: 14px;
    color: #9ca3af;
`;

const Footer = styled.div`
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
    flex: 1;
    padding: 14px;
    background: white;
    color: #6b7280;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #d1d5db;
        background: #f9fafb;
    }
`;

const ShareButton = styled.button`
    flex: 2;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Spinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;
