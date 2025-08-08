import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import YearlyFinanceOverview from "./YearlyFinanceOverview";
import { 
    Calendar, 
    Clock, 
    DollarSign, 
    Settings, 
    Heart,
    Cake,
    LogOut,
    User,
    Users,
    Sparkles
} from "lucide-react";

const getUpcomingBirthday = (pets) => {
    const today = dayjs().startOf("day");
    let closestPet = null;
    let minDays = Infinity;

    pets.forEach(pet => {
        if (pet.birthdate) {
            const birthdate = dayjs(pet.birthdate);
            const birthdayThisYear = birthdate.year(today.year());
            const birthdayNextYear = birthdate.year(today.year() + 1);

            let upcomingBirthday = birthdayThisYear.isAfter(today)
                ? birthdayThisYear
                : birthdayNextYear;

            const daysUntil = upcomingBirthday.diff(today, "day");

            if (daysUntil < minDays) {
                minDays = daysUntil;
                closestPet = { ...pet, upcomingBirthday };
            }
        }
    });

    return closestPet;
};

export default function Dashboard() {
    const { user, setUser } = useContext(UserContext);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [rates, setRates] = useState({
        thirty: user?.thirty || "",
        fourty: user?.fourty || "",
        sixty: user?.sixty || "",
        solo_rate: user?.solo_rate || "",
    });

    useEffect(() => {
        if (user?.pets) {
            setUpcomingBirthdayPet(getUpcomingBirthday(user.pets));
        }
    }, [user]);

    const handleRateChange = (e) => {
        setRates({
            ...rates,
            [e.target.name]: e.target.value
        });
    };

    const handleRateUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rates),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                alert("Rates updated successfully!");
            } else {
                console.error("Failed to update rates.");
            }
        } catch (error) {
            console.error("Error updating rates:", error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch("/logout", {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setUser(null);
            } else {
                console.error("Logout failed.");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const isRecurringOnDate = (appointment, date) => {
        const dayOfWeek = dayjs(date).day();
        const recurringDays = {
            0: appointment.sunday,
            1: appointment.monday,
            2: appointment.tuesday,
            3: appointment.wednesday,
            4: appointment.thursday,
            5: appointment.friday,
            6: appointment.saturday
        };
        return recurringDays[dayOfWeek];
    };

    const getAppointmentsForDate = (date) => {
        return (user?.appointments
            ?.filter(appointment => {
                if (appointment.canceled) return false;
    
                const formattedDate = dayjs(date).format("YYYY-MM-DD");
                const hasCancellation = appointment.cancellations?.some(cancellation =>
                    dayjs(cancellation.date).format("YYYY-MM-DD") === formattedDate
                );
                if (hasCancellation) return false;
    
                if (appointment.recurring) {
                    return isRecurringOnDate(appointment, date);
                }
                return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === formattedDate;
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
    };
    
    const appointments = getAppointmentsForDate(selectedDate);

    return (
        <Container>
            <HeaderSection>
                <WelcomeTitle>
                    <Sparkles size={32} />
                    Welcome back, {user?.name}!
                    <Heart size={28} />
                </WelcomeTitle>
                <SubtitleText>Manage your pet care business from your dashboard</SubtitleText>
            </HeaderSection>

            <ContentSections>
                <Section>
                    <SectionTitle>
                        <Calendar size={20} />
                        Schedule Overview
                    </SectionTitle>
                    <DateInputWrapper>
                        <DateInput
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </DateInputWrapper>
                    
                    {appointments.length === 0 ? (
                        <EmptyState>
                            <Clock size={40} />
                            <EmptyText>No appointments scheduled</EmptyText>
                        </EmptyState>
                    ) : (
                        <AppointmentsList>
                            <AppointmentsSummary>
                                {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} scheduled
                            </AppointmentsSummary>
                            {appointments.map((appointment) => (
                                <AppointmentItem key={appointment.id}>
                                    <PetImageContainer>
                                        <PetImage
                                            src={appointment.pet?.profile_pic || dogPlaceholder}
                                            onError={(e) => (e.target.src = dogPlaceholder)}
                                            alt={appointment.pet?.name}
                                        />
                                    </PetImageContainer>
                                    <AppointmentDetails>
                                        <PetName>{appointment.pet?.name}</PetName>
                                        <WalkInfo>
                                            <Clock size={12} />
                                            {appointment.duration} min • {dayjs(appointment.start_time).format("h:mm A")}
                                        </WalkInfo>
                                    </AppointmentDetails>
                                </AppointmentItem>
                            ))}
                        </AppointmentsList>
                    )}
                </Section>

                {upcomingBirthdayPet && (
                    <Section>
                        <SectionTitle>
                            <Cake size={20} />
                            Upcoming Birthday
                        </SectionTitle>
                        <BirthdayContent>
                            <BirthdayPetImage
                                src={upcomingBirthdayPet.profile_pic || dogPlaceholder}
                                onError={(e) => (e.target.src = dogPlaceholder)}
                                alt={upcomingBirthdayPet.name}
                            />
                            <BirthdayInfo>
                                <BirthdayPetName>{upcomingBirthdayPet.name}</BirthdayPetName>
                                <BirthdayDate>
                                    {dayjs(upcomingBirthdayPet.birthdate).format("MMMM D")}
                                </BirthdayDate>
                            </BirthdayInfo>
                        </BirthdayContent>
                    </Section>
                )}

                <Section>
                    <SectionTitle>
                        <Settings size={20} />
                        Update Your Rates
                    </SectionTitle>
                    <Form onSubmit={handleRateUpdate}>
                        <RateGrid>
                            <RateInputGroup>
                                <RateLabel>30 min</RateLabel>
                                <RateInputWrapper>
                                    <DollarSign size={14} />
                                    <RateInput 
                                        type="number" 
                                        name="thirty" 
                                        value={rates.thirty} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </RateInputWrapper>
                            </RateInputGroup>

                            <RateInputGroup>
                                <RateLabel>40 min</RateLabel>
                                <RateInputWrapper>
                                    <DollarSign size={14} />
                                    <RateInput 
                                        type="number" 
                                        name="fourty" 
                                        value={rates.fourty} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </RateInputWrapper>
                            </RateInputGroup>

                            <RateInputGroup>
                                <RateLabel>60 min</RateLabel>
                                <RateInputWrapper>
                                    <DollarSign size={14} />
                                    <RateInput 
                                        type="number" 
                                        name="sixty" 
                                        value={rates.sixty} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </RateInputWrapper>
                            </RateInputGroup>

                            <RateInputGroup>
                                <RateLabel>Solo</RateLabel>
                                <RateInputWrapper>
                                    <DollarSign size={14} />
                                    <RateInput 
                                        type="number" 
                                        name="solo_rate" 
                                        value={rates.solo_rate} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </RateInputWrapper>
                            </RateInputGroup>
                        </RateGrid>
                        <UpdateButton type="submit">
                            <Settings size={14} />
                            Update Rates
                        </UpdateButton>
                    </Form>
                </Section>
            </ContentSections>

            <YearlyFinanceOverview />
            
            <LogoutButton onClick={handleLogout}>
                <LogOut size={16} />
                Logout
            </LogoutButton>
        </Container>
    );
}

// Main Container with matching gradient
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

// Header Section
const HeaderSection = styled.div`
    text-align: center;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        margin-bottom: 32px;
    }
`;

const WelcomeTitle = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 2.8rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    
    svg:first-child {
        color: rgba(255, 255, 255, 0.8);
        animation: sparkle 2s ease-in-out infinite alternate;
    }
    
    svg:last-child {
        color: #ff6b9d;
        animation: heartbeat 1.5s ease-in-out infinite;
    }
    
    @keyframes sparkle {
        0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
        100% { transform: rotate(15deg) scale(1.1); opacity: 1; }
    }
    
    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @media (max-width: 768px) {
        font-size: 2.2rem;
        gap: 16px;
    }
    
    @media (max-width: 480px) {
        font-size: 1.8rem;
        gap: 12px;
        flex-wrap: wrap;
        
        svg {
            width: 24px;
            height: 24px;
        }
    }
`;

const SubtitleText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 480px) {
        font-size: 1.1rem;
    }
`;

// Simple content sections layout
const ContentSections = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 600px;
    margin-bottom: 16px;
`;

// Simplified section component
const Section = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8));
    border-radius: 16px;
    border: 2px solid rgba(139, 90, 140, 0.4);
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 16px;
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        border-color: #a569a7;
    }
`;

const SectionTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

// Date Input Styling
const DateInputWrapper = styled.div`
    margin-bottom: 12px;
`;

const DateInput = styled.input`
    width: 200px;
    max-width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ffffff;
    text-align: center;
    transition: all 0.3s ease;
    margin: 0 auto;
    display: block;
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
    
    &::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
`;

// Empty State
const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    
    svg {
        margin-bottom: 16px;
        opacity: 0.6;
    }
`;

const EmptyText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
`;

// Appointments List
const AppointmentsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const AppointmentsSummary = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 16px 0;
    text-align: center;
`;

const AppointmentItem = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
    }
`;

const PetImageContainer = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
`;

const PetImage = styled.img`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
`;

const AppointmentDetails = styled.div`
    flex: 1;
    text-align: left;
`;

const PetName = styled.h4`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 4px 0;
`;

const WalkInfo = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
`;

// Birthday Section
const BirthdayContent = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const BirthdayPetImage = styled.img`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
`;

const BirthdayInfo = styled.div`
    text-align: left;
`;

const BirthdayPetName = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 4px 0;
`;

const BirthdayDate = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-style: italic;
`;

// Rate Settings Form
const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const RateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
`;

const RateInputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const RateLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
`;

const RateInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    
    svg {
        position: absolute;
        left: 8px;
        color: rgba(255, 255, 255, 0.7);
        z-index: 1;
    }
    
    &:focus-within {
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
`;

const RateInput = styled.input`
    width: 100%;
    background: transparent;
    border: none;
    padding: 8px 10px 8px 28px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ffffff;
    
    &:focus {
        outline: none;
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
`;

const UpdateButton = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
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
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(34, 197, 94, 0.4);
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const LogoutButton = styled.button`
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(239, 68, 68, 0.4);
    }
    
    &:active {
        transform: translateY(0);
    }
`;