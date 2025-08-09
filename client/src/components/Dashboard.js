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
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    X
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
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showMonthView, setShowMonthView] = useState(false);
    const [monthViewDate, setMonthViewDate] = useState(dayjs());
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

    const getWeekDays = (date) => {
        const startOfWeek = date.startOf('week');
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(startOfWeek.add(i, 'day'));
        }
        return days;
    };

    const getMonthDays = (date) => {
        const startOfMonth = date.startOf('month');
        const endOfMonth = date.endOf('month');
        const startOfCalendar = startOfMonth.startOf('week');
        const endOfCalendar = endOfMonth.endOf('week');
        
        const days = [];
        let currentDay = startOfCalendar;
        
        while (currentDay.isBefore(endOfCalendar) || currentDay.isSame(endOfCalendar)) {
            days.push(currentDay);
            currentDay = currentDay.add(1, 'day');
        }
        
        return days;
    };

    const navigateWeek = (direction) => {
        setCurrentDate(prev => prev.add(direction * 1, 'week'));
    };

    const navigateMonth = (direction) => {
        setMonthViewDate(prev => prev.add(direction * 1, 'month'));
    };

    const weekDays = getWeekDays(currentDate);

    const handleDayClick = (day, appointments) => {
        if (appointments.length > 0) {
            setSelectedDate(day);
            setShowAppointments(true);
        }
    };

    const closeAppointmentsModal = () => {
        setShowAppointments(false);
        setSelectedDate(null);
    };

    return (
        <Container>
            <HeaderSection>
                <WelcomeTitle>
                    Welcome back, {user?.name}!
                </WelcomeTitle>
            </HeaderSection>

            <ContentSections>
                <Section>
                    <SectionHeader>
                        <SectionTitle>
                            <Calendar size={20} />
                            Week Overview
                        </SectionTitle>
                        <CalendarControls>
                            <MonthViewButton onClick={() => setShowMonthView(true)}>
                                <CalendarDays size={16} />
                                View Month
                            </MonthViewButton>
                            <NavigationControls>
                                <NavButton onClick={() => navigateWeek(-1)}>
                                    <ChevronLeft size={16} />
                                </NavButton>
                                <DateDisplay>
                                    {weekDays[0].format('MMM D')} - {weekDays[6].format('MMM D, YYYY')}
                                </DateDisplay>
                                <NavButton onClick={() => navigateWeek(1)}>
                                    <ChevronRight size={16} />
                                </NavButton>
                            </NavigationControls>
                        </CalendarControls>
                    </SectionHeader>
                    
                    <SectionContent>
                        <WeekWrapper>
                            <WeekGrid>
                                {weekDays.map((day) => {
                                    const dayAppointments = getAppointmentsForDate(day.format("YYYY-MM-DD"));
                                    const isToday = day.isSame(dayjs(), 'day');
                                    
                                    return (
                                        <WeekDayCell 
                                            key={day.format("YYYY-MM-DD")} 
                                            $isToday={isToday}
                                            $hasAppointments={dayAppointments.length > 0}
                                            onClick={() => handleDayClick(day, dayAppointments)}
                                        >
                                            <WeekDayNumber $isToday={isToday}>
                                                {day.format('ddd D')}
                                            </WeekDayNumber>
                                            
                                            {dayAppointments.length > 0 && (
                                                <WeekWalkBadge>
                                                    {dayAppointments.length} walk{dayAppointments.length > 1 ? 's' : ''}
                                                </WeekWalkBadge>
                                            )}
                                        </WeekDayCell>
                                    );
                                })}
                            </WeekGrid>
                        </WeekWrapper>
                    </SectionContent>
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
            
            {showAppointments && selectedDate && (
                <AppointmentsModal onClick={closeAppointmentsModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                Walks for {selectedDate.format('dddd, MMMM D')}
                            </ModalTitle>
                            <CloseButton onClick={closeAppointmentsModal}>
                                <X size={20} />
                            </CloseButton>
                        </ModalHeader>
                        <ModalAppointmentsList>
                            {getAppointmentsForDate(selectedDate.format("YYYY-MM-DD")).map((appointment, index) => (
                                <ModalAppointmentItem key={`${appointment.id}-${index}`}>
                                    <AppointmentTimeSlot>
                                        {dayjs(appointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(appointment.end_time, "HH:mm").format("h:mm A")}
                                    </AppointmentTimeSlot>
                                    <AppointmentPetInfo>
                                        <PetNameLarge>{appointment.pet?.name}</PetNameLarge>
                                        <AppointmentDetails>
                                            {appointment.duration} minutes • {appointment.recurring ? 'Recurring' : 'One-time'}
                                        </AppointmentDetails>
                                    </AppointmentPetInfo>
                                </ModalAppointmentItem>
                            ))}
                        </ModalAppointmentsList>
                    </ModalContent>
                </AppointmentsModal>
            )}
            
            {showMonthView && (
                <MonthModal onClick={() => setShowMonthView(false)}>
                    <MonthModalContent onClick={(e) => e.stopPropagation()}>
                        <MonthModalHeader>
                            <MonthModalTitle>
                                {monthViewDate.format('MMMM YYYY')}
                            </MonthModalTitle>
                            <MonthModalControls>
                                <NavButton onClick={() => navigateMonth(-1)}>
                                    <ChevronLeft size={16} />
                                </NavButton>
                                <NavButton onClick={() => navigateMonth(1)}>
                                    <ChevronRight size={16} />
                                </NavButton>
                                <CloseButton onClick={() => setShowMonthView(false)}>
                                    <X size={20} />
                                </CloseButton>
                            </MonthModalControls>
                        </MonthModalHeader>
                        <MonthCalendarGrid>
                            <MonthDayHeader>Sun</MonthDayHeader>
                            <MonthDayHeader>Mon</MonthDayHeader>
                            <MonthDayHeader>Tue</MonthDayHeader>
                            <MonthDayHeader>Wed</MonthDayHeader>
                            <MonthDayHeader>Thu</MonthDayHeader>
                            <MonthDayHeader>Fri</MonthDayHeader>
                            <MonthDayHeader>Sat</MonthDayHeader>
                            
                            {getMonthDays(monthViewDate).map((day) => {
                                const dayAppointments = getAppointmentsForDate(day.format("YYYY-MM-DD"));
                                const isToday = day.isSame(dayjs(), 'day');
                                const isCurrentMonth = day.isSame(monthViewDate, 'month');
                                
                                return (
                                    <MonthDayCell 
                                        key={day.format("YYYY-MM-DD")} 
                                        $isToday={isToday}
                                        $isCurrentMonth={isCurrentMonth}
                                        $hasAppointments={dayAppointments.length > 0}
                                        onClick={() => {
                                            if (dayAppointments.length > 0) {
                                                setSelectedDate(day);
                                                setShowAppointments(true);
                                                setShowMonthView(false);
                                            }
                                        }}
                                    >
                                        <MonthDayNumber $isToday={isToday}>
                                            {day.format('D')}
                                        </MonthDayNumber>
                                        {dayAppointments.length > 0 && (
                                            <MonthWalkIndicator>
                                                {dayAppointments.length}
                                            </MonthWalkIndicator>
                                        )}
                                    </MonthDayCell>
                                );
                            })}
                        </MonthCalendarGrid>
                    </MonthModalContent>
                </MonthModal>
            )}
        </Container>
    );
}

const Container = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 40px 20px;
    padding-top: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 2px, transparent 2px),
            radial-gradient(circle at 80% 40%, rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.06) 2.5px, transparent 2.5px),
            radial-gradient(circle at 15% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(circle at 90% 15%, rgba(255,255,255,0.04) 1.5px, transparent 1.5px);
        background-size: 80px 80px, 60px 60px, 40px 40px, 100px 100px, 30px 30px, 70px 70px;
        pointer-events: none;
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

const HeartIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.5);
    animation: heartbeat 1.5s ease-in-out infinite;
    
    @media (max-width: 768px) {
        padding: 6px;
        
        svg {
            width: 28px !important;
            height: 28px !important;
        }
    }
    
    @media (max-width: 480px) {
        padding: 5px;
        
        svg {
            width: 24px !important;
            height: 24px !important;
        }
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

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
    
    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }
`;

const SectionContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const SectionTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    
    @media (max-width: 1024px) {
        font-size: 1.15rem;
    }
    
    @media (max-width: 768px) {
        font-size: 1.1rem;
    }
    
    @media (max-width: 480px) {
        font-size: 1.05rem;
    }
`;

// Date Input Styling
const DateInput = styled.input`
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 8px 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #ffffff;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
    min-width: 140px;
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 0 2px rgba(165, 105, 167, 0.2);
    }
    
    &::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0.8;
    }
    
    @media (max-width: 480px) {
        min-width: 120px;
        font-size: 0.8rem;
        padding: 6px 10px;
    }
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

// Week View Components
const WeekWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
    
    &::-webkit-scrollbar {
        height: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
    }
`;

const WeekGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, minmax(140px, 1fr));
    gap: 12px;
    min-width: 980px;
    
    @media (max-width: 768px) {
        grid-template-columns: repeat(7, minmax(120px, 1fr));
        gap: 8px;
        min-width: 840px;
    }
    
    @media (max-width: 480px) {
        grid-template-columns: repeat(7, minmax(100px, 1fr));
        gap: 6px;
        min-width: 700px;
    }
`;

const WeekDayCell = styled.div`
    background: ${props => props.$isToday ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'};
    border: ${props => props.$isToday ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'};
    border-radius: 12px;
    padding: 16px 12px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: ${props => props.$hasAppointments ? 'pointer' : 'default'};
    transition: all 0.3s ease;
    
    &:hover {
        background: ${props => props.$hasAppointments ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'};
        transform: ${props => props.$hasAppointments ? 'translateY(-2px)' : 'none'};
    }
    
    @media (max-width: 480px) {
        padding: 12px 8px;
        min-height: 70px;
        gap: 8px;
    }
`;

const WeekDayNumber = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$isToday ? '1rem' : '0.9rem'};
    font-weight: ${props => props.$isToday ? '700' : '600'};
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
    text-align: center;
`;

const WeekWalkBadge = styled.div`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    white-space: nowrap;
`;

const MonthViewButton = styled.button`
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: #ffffff;
    padding: 8px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
    }
    
    @media (max-width: 480px) {
        padding: 8px 12px;
        font-size: 0.82rem;
    }
`;

// Calendar Controls
const CalendarControls = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    flex: 1;
    justify-content: flex-end;
    
    @media (max-width: 1024px) {
        gap: 12px;
    }
    
    @media (max-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        gap: 12px;
    }
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }
`;

const ViewToggle = styled.div`
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    @media (max-width: 480px) {
        justify-content: center;
    }
`;

const ViewButton = styled.button`
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
    
    @media (max-width: 1024px) {
        padding: 8px 14px;
        font-size: 0.83rem;
    }
    
    @media (max-width: 480px) {
        padding: 8px 16px;
        font-size: 0.82rem;
        flex: 1;
    }
`;

const NavigationControls = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    
    @media (max-width: 480px) {
        justify-content: center;
        width: 100%;
    }
`;

const NavButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const DateDisplay = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
    min-width: 180px;
    white-space: nowrap;
    
    @media (max-width: 1024px) {
        min-width: 160px;
        font-size: 0.88rem;
    }
    
    @media (max-width: 768px) {
        min-width: 140px;
        font-size: 0.86rem;
    }
    
    @media (max-width: 480px) {
        min-width: auto;
        font-size: 0.85rem;
    }
`;

const CalendarWrapper = styled.div`
    width: 100%;
    overflow-x: ${props => props.$viewMode === 'week' ? 'auto' : 'hidden'};
    overflow-y: visible;
    
    /* Custom scrollbar for week view */
    &::-webkit-scrollbar {
        height: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`;

const CalendarGrid = styled.div`
    display: grid;
    grid-template-columns: ${props => props.$viewMode === 'week' ? 'repeat(7, minmax(200px, 1fr))' : 'repeat(7, 1fr)'};
    gap: ${props => props.$viewMode === 'week' ? '12px' : '1px'};
    width: ${props => props.$viewMode === 'week' ? 'max-content' : '100%'};
    min-width: ${props => props.$viewMode === 'week' ? '1400px' : 'auto'};
    max-width: ${props => props.$viewMode === 'month' ? '100%' : 'none'};
    background: ${props => props.$viewMode === 'month' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
    border-radius: ${props => props.$viewMode === 'month' ? '12px' : '0'};
    padding: ${props => props.$viewMode === 'month' ? '8px' : '0'};
    box-sizing: border-box;
    
    @media (max-width: 768px) {
        gap: ${props => props.$viewMode === 'week' ? '8px' : '1px'};
        grid-template-columns: ${props => props.$viewMode === 'week' ? 'repeat(7, minmax(180px, 1fr))' : 'repeat(7, 1fr)'};
        min-width: ${props => props.$viewMode === 'week' ? '1260px' : 'auto'};
        padding: ${props => props.$viewMode === 'month' ? '4px' : '0'};
    }
    
    @media (max-width: 480px) {
        grid-template-columns: ${props => props.$viewMode === 'week' ? 'repeat(7, minmax(160px, 1fr))' : 'repeat(7, 1fr)'};
        min-width: ${props => props.$viewMode === 'week' ? '1120px' : 'auto'};
        gap: ${props => props.$viewMode === 'week' ? '6px' : '0'};
        padding: ${props => props.$viewMode === 'month' ? '2px' : '0'};
    }
`;

const DayHeader = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    padding: 8px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const DayCell = styled.div`
    background: ${props => {
        if (props.$isToday) return 'rgba(255, 255, 255, 0.25)';
        if (props.$viewMode === 'week') return 'rgba(255, 255, 255, 0.1)';
        return props.$isCurrentMonth ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
    }};
    border: ${props => props.$isToday ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'};
    border-radius: ${props => props.$viewMode === 'week' ? '12px' : '6px'};
    padding: ${props => props.$viewMode === 'week' ? '12px 10px' : '6px 4px'};
    min-height: ${props => props.$viewMode === 'week' ? '80px' : '60px'};
    display: flex;
    flex-direction: column;
    gap: ${props => props.$viewMode === 'week' ? '8px' : '4px'};
    transition: all 0.3s ease;
    opacity: ${props => props.$isCurrentMonth ? 1 : 0.5};
    cursor: ${props => props.$hasAppointments ? 'pointer' : 'default'};
    align-items: center;
    justify-content: ${props => props.$viewMode === 'week' ? 'flex-start' : 'center'};
    text-align: center;
    
    &:hover {
        background: ${props => {
            if (props.$hasAppointments) {
                if (props.$isToday) return 'rgba(255, 255, 255, 0.35)';
                return 'rgba(255, 255, 255, 0.2)';
            }
            if (props.$isToday) return 'rgba(255, 255, 255, 0.3)';
            return props.$viewMode === 'week' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.12)';
        }};
        transform: ${props => props.$hasAppointments ? 'translateY(-1px) scale(1.02)' : 'none'};
    }
    
    @media (max-width: 768px) {
        min-height: ${props => props.$viewMode === 'week' ? '70px' : '50px'};
        padding: ${props => props.$viewMode === 'week' ? '8px 6px' : '4px 3px'};
    }
    
    @media (max-width: 480px) {
        min-height: ${props => props.$viewMode === 'week' ? '60px' : '45px'};
        padding: ${props => props.$viewMode === 'week' ? '6px 4px' : '3px 2px'};
    }
`;

const DayNumber = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$isToday ? '1rem' : '0.9rem'};
    font-weight: ${props => props.$isToday ? '700' : '600'};
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
    text-align: center;
    margin-bottom: 4px;
    
    @media (max-width: 480px) {
        font-size: ${props => props.$isToday ? '0.9rem' : '0.8rem'};
    }
`;

const AppointmentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${props => props.$viewMode === 'week' ? '6px' : '4px'};
    flex: 1;
    overflow: hidden;
`;

const AppointmentItem = styled.div`
    background: rgba(255, 255, 255, 0.15);
    border-radius: ${props => props.$viewMode === 'week' ? '8px' : '6px'};
    padding: ${props => props.$viewMode === 'week' ? '8px 10px' : '6px 8px'};
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: ${props => props.$viewMode === 'week' ? 'column' : 'row'};
    gap: ${props => props.$viewMode === 'week' ? '4px' : '6px'};
    align-items: ${props => props.$viewMode === 'week' ? 'flex-start' : 'center'};
    cursor: pointer;
    
    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 480px) {
        padding: ${props => props.$viewMode === 'week' ? '6px 8px' : '4px 6px'};
        gap: ${props => props.$viewMode === 'week' ? '3px' : '4px'};
    }
`;

const AppointmentTime = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$viewMode === 'week' ? '0.7rem' : '0.6rem'};
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    order: ${props => props.$viewMode === 'week' ? '1' : '3'};
    min-width: ${props => props.$viewMode === 'month' ? '45px' : 'auto'};
    
    @media (max-width: 480px) {
        font-size: ${props => props.$viewMode === 'week' ? '0.65rem' : '0.55rem'};
        min-width: ${props => props.$viewMode === 'month' ? '40px' : 'auto'};
    }
`;

const AppointmentPetName = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$viewMode === 'week' ? '0.8rem' : '0.7rem'};
    font-weight: 700;
    color: #ffffff;
    order: ${props => props.$viewMode === 'week' ? '2' : '1'};
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    @media (max-width: 480px) {
        font-size: ${props => props.$viewMode === 'week' ? '0.75rem' : '0.65rem'};
    }
`;

const AppointmentDuration = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$viewMode === 'week' ? '0.65rem' : '0.55rem'};
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    order: ${props => props.$viewMode === 'week' ? '3' : '2'};
    
    @media (max-width: 480px) {
        font-size: ${props => props.$viewMode === 'week' ? '0.6rem' : '0.5rem'};
    }
`;

// Walk Count Badge
const WalkCountBadge = styled.div`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$viewMode === 'week' ? '0.75rem' : '0.7rem'};
    font-weight: 600;
    padding: ${props => props.$viewMode === 'week' ? '6px 12px' : '4px 8px'};
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    text-align: center;
    white-space: nowrap;
    
    @media (max-width: 480px) {
        font-size: ${props => props.$viewMode === 'week' ? '0.7rem' : '0.65rem'};
        padding: ${props => props.$viewMode === 'week' ? '5px 10px' : '3px 6px'};
    }
`;

// Modal Components
const AppointmentsModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 20px;
    box-shadow: 0px 20px 60px rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
`;

const CloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    padding: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
`;

const ModalAppointmentsList = styled.div`
    padding: 16px 24px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ModalAppointmentItem = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
    }
`;

const AppointmentTimeSlot = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #22c55e;
    margin-bottom: 8px;
`;

const AppointmentPetInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const PetNameLarge = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
`;

const AppointmentDetails = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
`;

// Month Modal Components
const MonthModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

const MonthModalContent = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.98), rgba(107, 43, 107, 0.95));
    border-radius: 24px;
    box-shadow: 0px 30px 80px rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const MonthModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MonthModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
`;

const MonthModalControls = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const MonthCalendarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    flex: 1;
    overflow-y: auto;
`;

const MonthDayHeader = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    padding: 12px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MonthDayCell = styled.div`
    background: ${props => {
        if (props.$isToday) return 'rgba(255, 255, 255, 0.2)';
        return props.$isCurrentMonth ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
    }};
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 8px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: ${props => props.$hasAppointments ? 'pointer' : 'default'};
    opacity: ${props => props.$isCurrentMonth ? 1 : 0.5};
    transition: all 0.3s ease;
    
    &:hover {
        background: ${props => props.$hasAppointments ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
        transform: ${props => props.$hasAppointments ? 'scale(1.05)' : 'none'};
    }
    
    @media (max-width: 768px) {
        min-height: 70px;
        padding: 8px 6px;
    }
    
    @media (max-width: 480px) {
        min-height: 60px;
        padding: 6px 4px;
    }
`;

const MonthDayNumber = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$isToday ? '1.1rem' : '1rem'};
    font-weight: ${props => props.$isToday ? '700' : '500'};
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
`;

const MonthWalkIndicator = styled.div`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
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