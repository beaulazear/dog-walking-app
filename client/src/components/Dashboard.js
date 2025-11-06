import React, { useContext, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import YearlyFinanceOverview from "./YearlyFinanceOverview";
import ConfirmModal from "./ConfirmModal";
import { useConfirm } from "../hooks/useConfirm";
import {
    DollarSign,
    Settings,
    Cake,
    LogOut,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    X,
    Trash2,
    Sparkles,
    Award,
    Trophy,
    Zap
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

const calculateTrainingHours = (invoices) => {
    if (!invoices) return { totalMinutes: 0, totalHours: 0 };

    // Filter for training walks and sum up their durations
    const trainingInvoices = invoices.filter(invoice =>
        invoice.title && invoice.title.toLowerCase().includes('training')
    );

    // Extract minutes from title (e.g., "30 min training walk" -> 30)
    const totalMinutes = trainingInvoices.reduce((sum, invoice) => {
        const match = invoice.title.match(/(\d+)\s*min/);
        if (match) {
            return sum + parseInt(match[1], 10);
        }
        return sum;
    }, 0);

    const totalHours = totalMinutes / 60;

    return { totalMinutes, totalHours };
};

export default function Dashboard() {
    const { user, setUser, removeAppointment } = useContext(UserContext);
    const { confirmState, confirm } = useConfirm();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showMonthView, setShowMonthView] = useState(false);
    const [monthViewDate, setMonthViewDate] = useState(dayjs());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingRates, setIsUpdatingRates] = useState(false);
    const [rates, setRates] = useState({
        thirty: user?.thirty || "",
        fortyfive: user?.fortyfive || "",
        sixty: user?.sixty || "",
        solo_rate: user?.solo_rate || "",
    });

    useEffect(() => {
        if (user?.pets) {
            setUpcomingBirthdayPet(getUpcomingBirthday(user.pets));
        }
    }, [user]);

    // Calculate training hours for certification
    const { totalHours } = calculateTrainingHours(user?.invoices);
    const goalHours = 300;
    const progressPercent = Math.min((totalHours / goalHours) * 100, 100);
    const hoursRemaining = Math.max(goalHours - totalHours, 0);

    const handleRateChange = (e) => {
        setRates({
            ...rates,
            [e.target.name]: e.target.value
        });
    };

    const handleRateUpdate = async (e) => {
        e.preventDefault();
        setIsUpdatingRates(true);

        try {
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rates),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUserData = await response.json();
                // Smart update - only update rate fields, not entire user object
                setUser(prevUser => ({
                    ...prevUser,
                    thirty: updatedUserData.thirty,
                    fortyfive: updatedUserData.fortyfive,
                    sixty: updatedUserData.sixty,
                    solo_rate: updatedUserData.solo_rate
                }));
                toast.success("Rates updated successfully!");
            } else {
                toast.error("Failed to update rates");
            }
        } catch (error) {
            console.error("Error updating rates:", error);
            toast.error("An error occurred while updating rates");
        } finally {
            setIsUpdatingRates(false);
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

    // Memoize helper function - stable reference across renders
    const isRecurringOnDate = useCallback((appointment, date) => {
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
    }, []);

    // Memoize expensive filtering operation
    const getAppointmentsForDate = useCallback((date) => {
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
    }, [user?.appointments, isRecurringOnDate]);

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

    const handleDeleteAppointment = async (appointmentId) => {
        const confirmed = await confirm({
            title: 'Delete Appointment',
            message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/appointments/${appointmentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                // Use smart update - prevents full re-render
                removeAppointment(appointmentId);
                toast.success('Appointment deleted successfully');
            } else {
                const error = await response.json();
                toast.error(`Failed to delete: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast.error('Failed to delete appointment');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Container>
            <ContentSections>
                <WeekOverviewSection>
                    <WeekHeader>
                        <ScheduleHeaderContainer>
                            <ScheduleIcon>
                                <Sparkles size={20} />
                            </ScheduleIcon>
                            <PersonalizedTitle>
                                {user?.name}'s Schedule
                            </PersonalizedTitle>
                        </ScheduleHeaderContainer>
                        <WeekNavigation>
                            <WeekNavButton onClick={() => navigateWeek(-1)}>
                                <ChevronLeft size={20} />
                            </WeekNavButton>
                            <WeekDateRange>
                                {weekDays[0].format('MMM D')} - {weekDays[6].format('MMM D')}
                            </WeekDateRange>
                            <WeekNavButton onClick={() => navigateWeek(1)}>
                                <ChevronRight size={20} />
                            </WeekNavButton>
                            <MonthToggle onClick={() => setShowMonthView(true)}>
                                <CalendarDays size={18} />
                            </MonthToggle>
                        </WeekNavigation>
                    </WeekHeader>
                    
                    <WeekCardsContainer>
                        {weekDays.map((day, index) => {
                            const dayAppointments = getAppointmentsForDate(day.format("YYYY-MM-DD"));
                            const isToday = day.isSame(dayjs(), 'day');
                            const isPast = day.isBefore(dayjs(), 'day');
                            
                            return (
                                <DayCard 
                                    key={day.format("YYYY-MM-DD")} 
                                    $isToday={isToday}
                                    $isPast={isPast}
                                    $hasAppointments={dayAppointments.length > 0}
                                    $delay={index * 0.05}
                                    onClick={() => handleDayClick(day, dayAppointments)}
                                >
                                    <DayCardHeader $isToday={isToday}>
                                        <DayName>{day.format('ddd')}</DayName>
                                        <DayDate $isToday={isToday}>{day.format('D')}</DayDate>
                                    </DayCardHeader>
                                    
                                    <DayCardContent>
                                        {dayAppointments.length > 0 ? (
                                            <>
                                                <WalkCount $count={dayAppointments.length}>
                                                    {dayAppointments.length}
                                                </WalkCount>
                                                <WalkLabel>
                                                    walk{dayAppointments.length > 1 ? 's' : ''}
                                                </WalkLabel>
                                                <PreviewDots>
                                                    {dayAppointments.slice(0, 3).map((_, i) => (
                                                        <Dot key={i} $delay={i * 0.1} />
                                                    ))}
                                                </PreviewDots>
                                            </>
                                        ) : (
                                            <EmptyDay>
                                                <EmptyIcon>—</EmptyIcon>
                                                <EmptyText>Free</EmptyText>
                                            </EmptyDay>
                                        )}
                                    </DayCardContent>
                                    
                                    {isToday && <TodayIndicator />}
                                </DayCard>
                            );
                        })}
                    </WeekCardsContainer>
                </WeekOverviewSection>

                {upcomingBirthdayPet && (
                    <ModernBirthdayCard>
                        <BirthdayHeader>
                            <BirthdayIcon>
                                <Cake size={20} />
                            </BirthdayIcon>
                            <BirthdayTitle>Birthday Coming Up!</BirthdayTitle>
                        </BirthdayHeader>
                        <ModernBirthdayContent>
                            <BirthdayImageWrapper>
                                <ModernBirthdayImage
                                    src={dogPlaceholder}
                                    alt={upcomingBirthdayPet.name}
                                    loading="lazy"
                                />
                                <BirthdayBadge>🎉</BirthdayBadge>
                            </BirthdayImageWrapper>
                            <ModernBirthdayInfo>
                                <ModernPetName>{upcomingBirthdayPet.name}</ModernPetName>
                                <ModernBirthdayDate>
                                    {dayjs(upcomingBirthdayPet.birthdate).format("MMMM D")}
                                </ModernBirthdayDate>
                                <DaysUntil>
                                    {(() => {
                                        const days = dayjs(upcomingBirthdayPet.upcomingBirthday).diff(dayjs(), 'day');
                                        if (days === 0) return "Today! 🎂";
                                        if (days === 1) return "Tomorrow!";
                                        return `In ${days} days`;
                                    })()}
                                </DaysUntil>
                            </ModernBirthdayInfo>
                        </ModernBirthdayContent>
                    </ModernBirthdayCard>
                )}

                <TrainingTrackerCard>
                    <TrainingHeader>
                        <TrainingIconWrapper>
                            <Trophy size={22} />
                        </TrainingIconWrapper>
                        <TrainingTitleSection>
                            <TrainingTitle>Certification Progress</TrainingTitle>
                            <TrainingSubtitle>Dog Walking Trainer Certification</TrainingSubtitle>
                        </TrainingTitleSection>
                    </TrainingHeader>

                    <TrainingContent>
                        <StatsRow>
                            <StatBox>
                                <StatValue>{totalHours.toFixed(1)}</StatValue>
                                <StatLabel>Hours Completed</StatLabel>
                            </StatBox>
                            <StatDivider />
                            <StatBox>
                                <StatValue>{hoursRemaining.toFixed(1)}</StatValue>
                                <StatLabel>Hours Remaining</StatLabel>
                            </StatBox>
                            <StatDivider />
                            <StatBox>
                                <StatValue>{progressPercent.toFixed(0)}%</StatValue>
                                <StatLabel>Progress</StatLabel>
                            </StatBox>
                        </StatsRow>

                        <ProgressBarContainer>
                            <ProgressBarBackground>
                                <ProgressBarFill $percent={progressPercent}>
                                    <ProgressGlow />
                                </ProgressBarFill>
                            </ProgressBarBackground>
                            <ProgressLabels>
                                <ProgressLabel>0h</ProgressLabel>
                                <ProgressLabel>300h</ProgressLabel>
                            </ProgressLabels>
                        </ProgressBarContainer>

                        <MilestonesContainer>
                            {[
                                { hours: 75, icon: '🌱', label: 'Beginner', color: '#10b981' },
                                { hours: 150, icon: '🌿', label: 'Intermediate', color: '#3b82f6' },
                                { hours: 225, icon: '🌳', label: 'Advanced', color: '#8b5cf6' },
                                { hours: 300, icon: '🏆', label: 'Certified', color: '#f59e0b' }
                            ].map((milestone, index) => {
                                const achieved = totalHours >= milestone.hours;
                                const isNext = totalHours < milestone.hours && (index === 0 || totalHours >= [75, 150, 225][index - 1]);
                                return (
                                    <MilestoneItem key={milestone.hours} $achieved={achieved} $isNext={isNext}>
                                        <MilestoneIcon $achieved={achieved} $color={milestone.color}>
                                            {milestone.icon}
                                        </MilestoneIcon>
                                        <MilestoneLabel $achieved={achieved}>{milestone.label}</MilestoneLabel>
                                        <MilestoneHours $achieved={achieved}>{milestone.hours}h</MilestoneHours>
                                        {achieved && <CheckBadge><Zap size={10} /></CheckBadge>}
                                    </MilestoneItem>
                                );
                            })}
                        </MilestonesContainer>

                        <MotivationalMessage>
                            {progressPercent === 100 ? (
                                <>🎉 Congratulations! You've completed your certification requirements!</>
                            ) : progressPercent >= 75 ? (
                                <>🔥 Almost there! Keep up the amazing work!</>
                            ) : progressPercent >= 50 ? (
                                <>💪 Halfway there! You're doing great!</>
                            ) : progressPercent >= 25 ? (
                                <>⭐ Great start! Keep building those hours!</>
                            ) : (
                                <>🚀 Start your certification journey with training walks!</>
                            )}
                        </MotivationalMessage>
                    </TrainingContent>
                </TrainingTrackerCard>

                <ModernRatesCard>
                    <RatesHeader>
                        <RatesIcon>
                            <DollarSign size={18} />
                        </RatesIcon>
                        <RatesTitle>Service Rates</RatesTitle>
                    </RatesHeader>
                    <ModernForm onSubmit={handleRateUpdate}>
                        <ModernRateGrid>
                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>30</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number" 
                                        name="thirty" 
                                        value={rates.thirty} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>45</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="fortyfive"
                                        value={rates.fortyfive}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>60</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number" 
                                        name="sixty" 
                                        value={rates.sixty} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard $solo>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>Solo</RateDuration>
                                    <RateMinutes>walk</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number" 
                                        name="solo_rate" 
                                        value={rates.solo_rate} 
                                        onChange={handleRateChange} 
                                        placeholder="0.00"
                                        step="0.01"
                                        required 
                                    />
                                </ModernRateInput>
                            </ModernRateCard>
                        </ModernRateGrid>
                        <ModernUpdateButton type="submit" disabled={isUpdatingRates}>
                            <Settings size={14} />
                            {isUpdatingRates ? 'Saving...' : 'Save Rates'}
                        </ModernUpdateButton>
                    </ModernForm>
                </ModernRatesCard>
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
                                    <AppointmentContent>
                                        <AppointmentTimeSlot>
                                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(appointment.end_time, "HH:mm").format("h:mm A")}
                                        </AppointmentTimeSlot>
                                        <AppointmentPetInfo>
                                            <PetNameLarge>{appointment.pet?.name}</PetNameLarge>
                                            <AppointmentDetails>
                                                {appointment.duration} minutes • {appointment.recurring ? 'Recurring' : 'One-time'}
                                            </AppointmentDetails>
                                        </AppointmentPetInfo>
                                    </AppointmentContent>
                                    <DeleteButton
                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                        title="Delete appointment"
                                        disabled={isDeleting}
                                    >
                                        <Trash2 size={18} />
                                    </DeleteButton>
                                </ModalAppointmentItem>
                            ))}
                        </ModalAppointmentsList>
                    </ModalContent>
                </AppointmentsModal>
            )}

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

// Simple content sections layout
const ContentSections = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 16px;
    
    @media (max-width: 768px) {
        gap: 16px;
    }
`;

// New Week Overview Section
const WeekOverviewSection = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: fadeInUp 0.5s ease;
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @media (max-width: 768px) {
        padding: 16px;
        border-radius: 20px;
    }
`;

const WeekHeader = styled.div`
    margin-bottom: 24px;

    @media (max-width: 768px) {
        margin-bottom: 20px;
    }
`;

const ScheduleHeaderContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
        margin-bottom: 16px;
    }
`;

const ScheduleIcon = styled.div`
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    animation: sparkleRotate 3s ease-in-out infinite;

    @keyframes sparkleRotate {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
    }
`;

const PersonalizedTitle = styled.h3`
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const MonthToggle = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
`;

const WeekNavigation = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const WeekNavButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

const WeekDateRange = styled.div`
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    min-width: 140px;
    text-align: center;
    
    @media (max-width: 768px) {
        font-size: 0.9rem;
        min-width: 120px;
    }
`;

const WeekCardsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    
    @media (max-width: 768px) {
        gap: 8px;
        overflow-x: auto;
        display: flex;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
        
        &::-webkit-scrollbar {
            height: 4px;
        }
        
        &::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
        }
        
        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
        }
    }
`;

const DayCard = styled.div`
    background: ${props => props.$hasAppointments 
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))' 
        : 'rgba(255, 255, 255, 0.05)'};
    border: 1px solid ${props => props.$isToday 
        ? 'rgba(255, 255, 255, 0.4)' 
        : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 16px;
    padding: 12px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: ${props => props.$hasAppointments ? 'pointer' : 'default'};
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    opacity: ${props => props.$isPast ? 0.6 : 1};
    animation: slideIn ${props => 0.5 + props.$delay}s ease;
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    &:hover {
        transform: ${props => props.$hasAppointments ? 'translateY(-4px) scale(1.02)' : 'none'};
        background: ${props => props.$hasAppointments 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.15))' 
            : 'rgba(255, 255, 255, 0.08)'};
        box-shadow: ${props => props.$hasAppointments 
            ? '0 8px 20px rgba(0, 0, 0, 0.2)' 
            : 'none'};
    }
    
    @media (max-width: 768px) {
        min-width: 90px;
        flex: 0 0 auto;
        scroll-snap-align: center;
        padding: 10px 8px;
        min-height: 90px;
    }
`;

const DayCardHeader = styled.div`
    text-align: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
`;

const DayName = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
`;

const DayDate = styled.div`
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
    font-size: 1.2rem;
    font-weight: ${props => props.$isToday ? '700' : '600'};
`;

const DayCardContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const WalkCount = styled.div`
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    background: ${props => {
        if (props.$count >= 5) return 'linear-gradient(135deg, #f59e0b, #dc2626)';
        if (props.$count >= 3) return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        return 'linear-gradient(135deg, #10b981, #06b6d4)';
    }};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    
    @media (max-width: 768px) {
        font-size: 1.6rem;
    }
`;

const WalkLabel = styled.div`
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    font-weight: 500;
    margin-top: 2px;
`;

const PreviewDots = styled.div`
    display: flex;
    gap: 4px;
    margin-top: 8px;
`;

const Dot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    animation: pulse ${props => 2 + props.$delay}s infinite;
    
    @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.2); }
    }
`;

const EmptyDay = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

const EmptyIcon = styled.div`
    color: rgba(255, 255, 255, 0.3);
    font-size: 1.2rem;
`;

const EmptyText = styled.div`
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    font-weight: 500;
`;

const TodayIndicator = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    animation: todayPulse 2s infinite;
    
    @keyframes todayPulse {
        0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
        }
        50% { 
            transform: scale(1.2);
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
        }
    }
`;

// Modern Birthday Card
const ModernBirthdayCard = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: fadeInUp 0.6s ease;
    
    @media (max-width: 768px) {
        padding: 16px;
        border-radius: 20px;
    }
`;

const BirthdayHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
`;

const BirthdayIcon = styled.div`
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
`;

const BirthdayTitle = styled.h3`
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
`;

const ModernBirthdayContent = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
`;

const BirthdayImageWrapper = styled.div`
    position: relative;
`;

const ModernBirthdayImage = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 20px;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
`;

const BirthdayBadge = styled.div`
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: linear-gradient(135deg, #ec4899, #f43f5e);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
`;

const ModernBirthdayInfo = styled.div`
    flex: 1;
`;

const ModernPetName = styled.h3`
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 4px 0;
`;

const ModernBirthdayDate = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
    margin: 0 0 8px 0;
`;

const DaysUntil = styled.div`
    display: inline-block;
    background: rgba(255, 255, 255, 0.1);
    color: #10b981;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.3);
`;

// Modern Rates Card - Compact Version
const ModernRatesCard = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: fadeInUp 0.7s ease;
    
    @media (max-width: 768px) {
        padding: 14px;
        border-radius: 18px;
    }
`;

const RatesHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
`;

const RatesIcon = styled.div`
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #10b981, #06b6d4);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
`;

const RatesTitle = styled.h3`
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
`;

const ModernForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ModernRateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
    
    @media (max-width: 480px) {
        gap: 8px;
    }
`;

const ModernRateCard = styled.div`
    background: ${props => props.$solo 
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.08))' 
        : 'rgba(255, 255, 255, 0.04)'};
    border: 1px solid ${props => props.$solo 
        ? 'rgba(168, 85, 247, 0.25)' 
        : 'rgba(255, 255, 255, 0.08)'};
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    
    &:hover {
        transform: translateY(-1px);
        background: ${props => props.$solo 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))' 
            : 'rgba(255, 255, 255, 0.06)'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 480px) {
        padding: 8px;
        gap: 6px;
    }
`;

const RateDuration = styled.div`
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    white-space: nowrap;
    
    @media (max-width: 480px) {
        font-size: 1rem;
    }
`;

const RateMinutes = styled.div`
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
`;

const ModernRateInput = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 6px 8px;
    transition: all 0.3s ease;
    min-width: 0;
    overflow: hidden;
    
    &:focus-within {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.08);
    }
    
    @media (max-width: 480px) {
        padding: 5px 6px;
    }
`;

const DollarSymbol = styled.span`
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    font-weight: 600;
    margin-right: 2px;
`;

const RateField = styled.input`
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    width: 100%;
    max-width: 60px;
    outline: none;
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.25);
    }
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    @media (max-width: 480px) {
        font-size: 0.85rem;
        max-width: 50px;
    }
`;

const ModernUpdateButton = styled.button`
    background: linear-gradient(135deg, #10b981, #06b6d4);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
    margin-top: 4px;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    
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

const AppointmentContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
`;

const DeleteButton = styled.button`
    background: rgba(255, 77, 77, 0.2);
    border: 1px solid rgba(255, 77, 77, 0.3);
    border-radius: 8px;
    padding: 8px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        background: rgba(255, 77, 77, 0.3);
        border-color: rgba(255, 77, 77, 0.5);
        transform: scale(1.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }
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

// Training Tracker Components
const TrainingTrackerCard = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: fadeInUp 0.65s ease;
    border: 1px solid rgba(255, 215, 0, 0.2);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%);
        animation: shimmer 8s linear infinite;
    }

    @keyframes shimmer {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        padding: 20px;
        border-radius: 20px;
    }
`;

const TrainingHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;
`;

const TrainingIconWrapper = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    animation: trophyPulse 3s ease-in-out infinite;

    @keyframes trophyPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
        50% { transform: scale(1.05); box-shadow: 0 8px 28px rgba(245, 158, 11, 0.6); }
    }
`;

const TrainingTitleSection = styled.div`
    flex: 1;
`;

const TrainingTitle = styled.h3`
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    background: linear-gradient(135deg, #ffffff, #fbbf24);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const TrainingSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin: 0;
`;

const TrainingContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
`;

const StatsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 16px;
    align-items: center;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 12px;
    }
`;

const StatBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

const StatValue = styled.div`
    font-size: 2rem;
    font-weight: 800;
    color: #fbbf24;
    line-height: 1;
    text-shadow: 0 2px 10px rgba(251, 191, 36, 0.4);

    @media (max-width: 480px) {
        font-size: 1.6rem;
    }
`;

const StatLabel = styled.div`
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
`;

const StatDivider = styled.div`
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 480px) {
        display: none;
    }
`;

const ProgressBarContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ProgressBarBackground = styled.div`
    width: 100%;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const ProgressBarFill = styled.div`
    width: ${props => props.$percent}%;
    height: 100%;
    background: linear-gradient(90deg, #10b981, #22c55e, #fbbf24);
    border-radius: 12px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
`;

const ProgressGlow = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: progressShine 2s infinite;

    @keyframes progressShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;

const ProgressLabels = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
`;

const ProgressLabel = styled.span`
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
`;

const MilestonesContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const MilestoneItem = styled.div`
    background: ${props =>
        props.$achieved ? 'rgba(16, 185, 129, 0.15)' :
        props.$isNext ? 'rgba(59, 130, 246, 0.1)' :
        'rgba(255, 255, 255, 0.05)'};
    border: 2px solid ${props =>
        props.$achieved ? 'rgba(16, 185, 129, 0.4)' :
        props.$isNext ? 'rgba(59, 130, 246, 0.3)' :
        'rgba(255, 255, 255, 0.1)'};
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    position: relative;
    transition: all 0.3s ease;

    ${props => props.$achieved && `
        animation: milestoneAchieved 0.5s ease;
    `}

    @keyframes milestoneAchieved {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;

const MilestoneIcon = styled.div`
    font-size: 1.8rem;
    opacity: ${props => props.$achieved ? 1 : 0.4};
    filter: ${props => props.$achieved ? 'none' : 'grayscale(100%)'};
    transition: all 0.3s ease;
`;

const MilestoneLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    color: ${props => props.$achieved ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
    text-align: center;
`;

const MilestoneHours = styled.div`
    font-size: 0.7rem;
    color: ${props => props.$achieved ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
    font-weight: 500;
`;

const CheckBadge = styled.div`
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
    animation: checkBounce 0.5s ease;

    @keyframes checkBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
`;

const MotivationalMessage = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px 18px;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
    animation: fadeIn 0.5s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
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