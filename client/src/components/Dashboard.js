import React, { useContext, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import dayjs from "dayjs";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import ConfirmModal from "./ConfirmModal";
import { useConfirm } from "../hooks/useConfirm";
import {
    Cake,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    X,
    Trash2
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
    const { user, removeAppointment } = useContext(UserContext);
    const { confirmState, confirm } = useConfirm();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showAppointments, setShowAppointments] = useState(false);
    const [showMonthView, setShowMonthView] = useState(false);
    const [monthViewDate, setMonthViewDate] = useState(dayjs());
    const [isDeleting, setIsDeleting] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showPetInfoModal, setShowPetInfoModal] = useState(false);
    const calendarGridRef = React.useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (user?.pets) {
            setUpcomingBirthdayPet(getUpcomingBirthday(user.pets));
        }
        setPhotoError(false); // Reset photo error when user changes
    }, [user]);

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

    // Generate time slots for calendar grid (6 AM to 10 PM)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 22; hour++) {
            slots.push(hour);
        }
        return slots;
    };

    // Detect if two appointments overlap
    const appointmentsOverlap = (apt1, apt2) => {
        const start1 = dayjs(apt1.start_time, "HH:mm");
        const end1 = dayjs(apt1.end_time, "HH:mm");
        const start2 = dayjs(apt2.start_time, "HH:mm");
        const end2 = dayjs(apt2.end_time, "HH:mm");

        return start1.isBefore(end2) && start2.isBefore(end1);
    };

    // Calculate layout for overlapping appointments
    const calculateAppointmentLayout = (appointments) => {
        const layouts = appointments.map((apt, index) => {
            const startTime = dayjs(apt.start_time, "HH:mm");
            const endTime = dayjs(apt.end_time, "HH:mm");
            const startHour = startTime.hour() + startTime.minute() / 60;
            const endHour = endTime.hour() + endTime.minute() / 60;

            return {
                ...apt,
                index,
                top: (startHour - 6) * 60,
                height: (endHour - startHour) * 60,
                column: 0,
                totalColumns: 1
            };
        });

        // Find overlapping groups and assign columns
        for (let i = 0; i < layouts.length; i++) {
            const overlappingIndices = [i];

            for (let j = i + 1; j < layouts.length; j++) {
                if (appointmentsOverlap(appointments[i], appointments[j])) {
                    overlappingIndices.push(j);
                }
            }

            if (overlappingIndices.length > 1) {
                const totalColumns = overlappingIndices.length;
                overlappingIndices.forEach((idx, col) => {
                    layouts[idx].column = col;
                    layouts[idx].totalColumns = totalColumns;
                });
            }
        }

        return layouts;
    };

    // Auto-scroll to current time
    useEffect(() => {
        if (calendarGridRef.current) {
            const currentHour = dayjs().hour();
            if (currentHour >= 6 && currentHour <= 22) {
                const scrollPosition = (currentHour - 6) * 60 - 100; // Center current time
                setTimeout(() => {
                    calendarGridRef.current?.scrollTo({
                        top: Math.max(0, scrollPosition),
                        behavior: 'smooth'
                    });
                }, 300);
            }
        }
    }, [currentDate]);

    const navigateWeek = (direction) => {
        setCurrentDate(prev => prev.add(direction * 1, 'week'));
    };

    const navigateMonth = (direction) => {
        setMonthViewDate(prev => prev.add(direction * 1, 'month'));
    };

    // Swipe gesture handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            navigateWeek(1); // Next week
        }
        if (isRightSwipe) {
            navigateWeek(-1); // Previous week
        }
    };

    const weekDays = getWeekDays(currentDate);

    const closeAppointmentsModal = () => {
        setShowAppointments(false);
        setSelectedDate(null);
    };

    const closePetInfoModal = () => {
        setShowPetInfoModal(false);
        setSelectedAppointment(null);
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
            <TopHeader>
                <HeaderLogo src="/PocketWalks.svg" alt="Pocket Walks" />
            </TopHeader>
            <ContentSections>
                <ProfileHeader>
                    <ProfilePicWrapper>
                        {user?.profile_pic_url && !photoError ? (
                            <ProfilePic
                                src={user.profile_pic_url}
                                alt={user.name}
                                onError={() => setPhotoError(true)}
                            />
                        ) : (
                            <ProfilePic
                                src={dogPlaceholder}
                                alt="Profile placeholder"
                            />
                        )}
                    </ProfilePicWrapper>
                    <ProfileInfo>
                        <WelcomeText>
                            Welcome back, <UserName>{user?.name}</UserName>!
                        </WelcomeText>
                        <ProfileMetaRow>
                            <ProfileUsername>@{user?.username}</ProfileUsername>
                            <ProfileDivider>•</ProfileDivider>
                            <ProfileMemberSince>
                                On Pocket Walk since {dayjs(user?.created_at || new Date()).format('MMM YYYY')}
                            </ProfileMemberSince>
                        </ProfileMetaRow>
                        {(() => {
                            const todayWalks = getAppointmentsForDate(dayjs().format("YYYY-MM-DD"));
                            return todayWalks.length > 0 ? (
                                <TodayWalksCount>
                                    {todayWalks.length} walk{todayWalks.length !== 1 ? 's' : ''} today
                                </TodayWalksCount>
                            ) : null;
                        })()}
                    </ProfileInfo>
                </ProfileHeader>

                <WeekOverviewSection
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <WeekHeader>
                        <ScheduleTitleRow>
                            <ScheduleTitle>
                                <CalendarDays size={20} />
                                Your Week
                            </ScheduleTitle>
                            <ButtonGroup>
                                <TodayButton onClick={() => navigate('/todays-walks')}>
                                    Today
                                </TodayButton>
                                <MonthViewButton onClick={() => setShowMonthView(true)}>
                                    <CalendarDays size={16} />
                                    Month
                                </MonthViewButton>
                            </ButtonGroup>
                        </ScheduleTitleRow>
                        <WeekNavigation>
                            <WeekNavButton onClick={() => navigateWeek(-1)}>
                                <ChevronLeft size={18} />
                            </WeekNavButton>
                            <WeekDateRange>
                                {weekDays[0].format('MMM D')} - {weekDays[6].format('MMM D')}
                            </WeekDateRange>
                            <WeekNavButton onClick={() => navigateWeek(1)}>
                                <ChevronRight size={18} />
                            </WeekNavButton>
                        </WeekNavigation>
                    </WeekHeader>
                    
                    <CalendarGridWrapper ref={calendarGridRef}>
                        <CalendarGrid>
                            {/* Time labels column */}
                            <TimeLabelsColumn>
                                <TimeHeaderSpacer />
                                {generateTimeSlots().map(hour => (
                                    <TimeLabel key={hour}>
                                        {dayjs().hour(hour).format('h A')}
                                    </TimeLabel>
                                ))}
                            </TimeLabelsColumn>

                            {/* Day columns */}
                            {weekDays.map((day, dayIndex) => {
                                const dayAppointments = getAppointmentsForDate(day.format("YYYY-MM-DD"));
                                const isToday = day.isSame(dayjs(), 'day');
                                const isPast = day.isBefore(dayjs(), 'day');

                                return (
                                    <DayColumn key={day.format("YYYY-MM-DD")} $isToday={isToday}>
                                        {/* Day header - clickable for full day view */}
                                        <DayColumnHeader
                                            $isToday={isToday}
                                            $isPast={isPast}
                                            $clickable={dayAppointments.length > 0}
                                            onClick={() => {
                                                if (dayAppointments.length > 0) {
                                                    setSelectedDate(day);
                                                    setShowAppointments(true);
                                                }
                                            }}
                                        >
                                            <DayHeaderName>{day.format('ddd')}</DayHeaderName>
                                            <DayHeaderDate $isToday={isToday}>{day.format('D')}</DayHeaderDate>
                                        </DayColumnHeader>

                                        {/* Time grid cells */}
                                        <DayColumnContent>
                                            {generateTimeSlots().map(hour => (
                                                <TimeSlotCell key={hour} $isToday={isToday} />
                                            ))}

                                            {/* Appointment blocks */}
                                            {calculateAppointmentLayout(dayAppointments).map((layout) => {
                                                const widthPercent = (100 / layout.totalColumns);
                                                const leftPercent = (layout.column * widthPercent);

                                                return (
                                                    <AppointmentBlock
                                                        key={`${layout.id}-${layout.index}`}
                                                        $top={layout.top}
                                                        $height={layout.height}
                                                        $left={leftPercent}
                                                        $width={widthPercent}
                                                        $isPast={isPast}
                                                        $isOverlapping={layout.totalColumns > 1}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAppointment({...layout, date: day});
                                                            setShowPetInfoModal(true);
                                                        }}
                                                    >
                                                        <AppointmentBlockContent>
                                                            <AppointmentPetName>{layout.pet?.name}</AppointmentPetName>
                                                            <AppointmentBlockTime>
                                                                {dayjs(layout.start_time, "HH:mm").format("h:mm A")}
                                                            </AppointmentBlockTime>
                                                        </AppointmentBlockContent>
                                                    </AppointmentBlock>
                                                );
                                            })}

                                            {/* Current time indicator */}
                                            {isToday && (() => {
                                                const currentHour = dayjs().hour() + dayjs().minute() / 60;
                                                if (currentHour >= 6 && currentHour <= 22) {
                                                    const position = (currentHour - 6) * 60;
                                                    return (
                                                        <CurrentTimeIndicator $top={position}>
                                                            <CurrentTimeDot />
                                                            <CurrentTimeLine />
                                                        </CurrentTimeIndicator>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </DayColumnContent>
                                    </DayColumn>
                                );
                            })}
                        </CalendarGrid>
                    </CalendarGridWrapper>
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
            </ContentSections>

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

            {showPetInfoModal && selectedAppointment && (
                <AppointmentsModal onClick={closePetInfoModal}>
                    <PetInfoModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                {selectedAppointment.pet?.name}
                            </ModalTitle>
                            <CloseButton onClick={closePetInfoModal}>
                                <X size={20} />
                            </CloseButton>
                        </ModalHeader>
                        <PetInfoContent>
                            <PetInfoSection>
                                <PetInfoLabel>Date & Time</PetInfoLabel>
                                <PetInfoValue>
                                    {selectedAppointment.date?.format('dddd, MMMM D, YYYY')}
                                </PetInfoValue>
                                <PetInfoValue>
                                    {dayjs(selectedAppointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(selectedAppointment.end_time, "HH:mm").format("h:mm A")}
                                </PetInfoValue>
                                <PetInfoBadge>
                                    {selectedAppointment.duration} minutes
                                </PetInfoBadge>
                            </PetInfoSection>

                            {selectedAppointment.pet?.owner && (
                                <PetInfoSection>
                                    <PetInfoLabel>Owner</PetInfoLabel>
                                    <PetInfoValue>{selectedAppointment.pet.owner.name}</PetInfoValue>
                                    {selectedAppointment.pet.owner.email && (
                                        <PetInfoValue>{selectedAppointment.pet.owner.email}</PetInfoValue>
                                    )}
                                    {selectedAppointment.pet.owner.phone_number && (
                                        <PetInfoValue>{selectedAppointment.pet.owner.phone_number}</PetInfoValue>
                                    )}
                                </PetInfoSection>
                            )}

                            {selectedAppointment.pet?.address && (
                                <PetInfoSection>
                                    <PetInfoLabel>Address</PetInfoLabel>
                                    <PetInfoValue>{selectedAppointment.pet.address}</PetInfoValue>
                                </PetInfoSection>
                            )}

                            {selectedAppointment.pet?.breed && (
                                <PetInfoSection>
                                    <PetInfoLabel>Breed</PetInfoLabel>
                                    <PetInfoValue>{selectedAppointment.pet.breed}</PetInfoValue>
                                </PetInfoSection>
                            )}

                            {selectedAppointment.recurring && (
                                <PetInfoSection>
                                    <PetInfoLabel>Recurring</PetInfoLabel>
                                    <PetInfoBadge>This is a recurring appointment</PetInfoBadge>
                                </PetInfoSection>
                            )}

                            <PetInfoActions>
                                <DeleteButton
                                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                                    title="Delete appointment"
                                    disabled={isDeleting}
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </DeleteButton>
                            </PetInfoActions>
                        </PetInfoContent>
                    </PetInfoModalContent>
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
    padding-bottom: 100px;
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
`;

const TopHeader = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 0.625rem 2rem;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;

    @media (max-width: 768px) {
        padding: 0.5rem 1.5rem;
    }

    @media (max-width: 480px) {
        padding: 0.5rem 1rem;
    }
`;

const HeaderLogo = styled.img`
    height: 85px;
    width: auto;
    max-width: 450px;
    display: block;

    @media (max-width: 768px) {
        height: 70px;
        max-width: 360px;
    }

    @media (max-width: 480px) {
        height: 58px;
        max-width: 280px;
    }
`;

const ContentSections = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 107px;

    @media (max-width: 768px) {
        padding-top: 92px;
    }

    @media (max-width: 480px) {
        padding-top: 80px;
    }
`;

// Profile Header Section
const ProfileHeader = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 1;
    animation: fadeInDown 0.5s ease;

    @keyframes fadeInDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const ProfilePicWrapper = styled.div`
    flex-shrink: 0;
`;

const ProfilePic = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const ProfileInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
`;

const WelcomeText = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.3;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const UserName = styled.span`
    font-weight: 700;
    color: #fff;
`;

const ProfileMetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    font-family: 'Poppins', sans-serif;

    @media (max-width: 768px) {
        font-size: 0.75rem;
    }
`;

const ProfileUsername = styled.span`
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
`;

const ProfileDivider = styled.span`
    color: rgba(255, 255, 255, 0.4);
`;

const ProfileMemberSince = styled.span`
    font-weight: 400;
`;

const TodayWalksCount = styled.div`
    display: inline-flex;
    align-items: center;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Poppins', sans-serif;
    width: fit-content;
    margin-top: 2px;

    @media (max-width: 768px) {
        font-size: 0.7rem;
        padding: 3px 8px;
    }
`;

// New Week Overview Section
const WeekOverviewSection = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 1;
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
        padding: 20px 16px;
    }
`;

const WeekHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
        gap: 12px;
        margin-bottom: 16px;
    }
`;

const ScheduleTitleRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

const ScheduleTitle = styled.h3`
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;

    @media (max-width: 768px) {
        font-size: 0.95rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const TodayButton = styled.button`
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 6px 14px;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Poppins', sans-serif;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
    }

    &:active {
        transform: scale(0.98);
    }

    @media (max-width: 768px) {
        padding: 5px 12px;
        font-size: 0.75rem;
    }
`;

const MonthViewButton = styled.button`
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 6px 14px;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Poppins', sans-serif;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
    }

    &:active {
        transform: scale(0.98);
    }

    @media (max-width: 768px) {
        padding: 5px 12px;
        font-size: 0.75rem;

        svg {
            width: 14px;
            height: 14px;
        }
    }
`;

const WeekNavigation = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
`;

const WeekNavButton = styled.button`
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const WeekDateRange = styled.div`
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 500;
    min-width: 140px;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    background: rgba(255, 255, 255, 0.08);
    padding: 6px 16px;
    border-radius: 8px;

    @media (max-width: 768px) {
        font-size: 0.85rem;
        min-width: 130px;
        padding: 5px 12px;
    }
`;

// Calendar Grid Components
const CalendarGridWrapper = styled.div`
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 600px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }

    @media (max-width: 768px) {
        max-height: calc(100vh - 320px);
        overflow-x: auto;
        border-radius: 16px;
        -webkit-overflow-scrolling: touch;
    }
`;

const CalendarGrid = styled.div`
    display: grid;
    grid-template-columns: 70px repeat(7, minmax(100px, 1fr));
    min-width: 900px;
    position: relative;

    @media (max-width: 768px) {
        grid-template-columns: 60px repeat(7, minmax(110px, 1fr));
        min-width: 800px;
    }
`;

const TimeLabelsColumn = styled.div`
    display: flex;
    flex-direction: column;
    border-right: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
`;

const TimeHeaderSpacer = styled.div`
    height: 60px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
`;

const TimeLabel = styled.div`
    height: 60px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 4px 12px 0 4px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-family: 'Poppins', sans-serif;

    @media (max-width: 768px) {
        font-size: 0.7rem;
        padding: 4px 8px 0 4px;
    }
`;

const DayColumn = styled.div`
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    background: ${props => props.$isToday ? 'rgba(59, 130, 246, 0.05)' : 'transparent'};

    &:last-child {
        border-right: none;
    }
`;

const DayColumnHeader = styled.div`
    height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    background: ${props => props.$isToday
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.2))'
        : 'rgba(255, 255, 255, 0.03)'};
    opacity: ${props => props.$isPast ? 0.6 : 1};
    flex-shrink: 0;
    cursor: ${props => props.$clickable ? 'pointer' : 'default'};
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: ${props => props.$clickable ? (props.$isToday
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(139, 92, 246, 0.3))'
            : 'rgba(255, 255, 255, 0.08)') : (props.$isToday
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.2))'
            : 'rgba(255, 255, 255, 0.03)')};
    }

    &:active {
        ${props => props.$clickable && `
            transform: scale(0.98);
        `}
    }

    @media (max-width: 768px) {
        height: 70px;
        gap: 6px;
    }
`;

const DayHeaderName = styled.div`
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'Poppins', sans-serif;
`;

const DayHeaderDate = styled.div`
    font-size: 1.3rem;
    font-weight: ${props => props.$isToday ? '700' : '600'};
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.95)'};
    font-family: 'Poppins', sans-serif;
    line-height: 1;
`;

const DayColumnContent = styled.div`
    position: relative;
    flex: 1;
`;

const TimeSlotCell = styled.div`
    height: 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:hover {
        background: ${props => props.$isToday
            ? 'rgba(59, 130, 246, 0.08)'
            : 'rgba(255, 255, 255, 0.03)'};
    }
`;

const AppointmentBlock = styled.div`
    position: absolute;
    left: ${props => props.$left || 0}%;
    width: ${props => props.$width ? `calc(${props.$width}% - ${props.$isOverlapping ? '4px' : '2px'})` : 'calc(100% - 4px)'};
    top: ${props => props.$top}px;
    height: ${props => Math.max(props.$height, 30)}px;
    min-height: 36px;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 185, 129, 0.75));
    border-left: 3px solid rgba(34, 197, 94, 1);
    border-radius: 6px;
    padding: ${props => props.$isOverlapping ? '4px 6px' : '6px 8px'};
    cursor: pointer;
    transition: all 0.15s ease;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    opacity: ${props => props.$isPast ? 0.5 : 1};
    z-index: 1;
    margin-left: 2px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    &:hover {
        transform: ${props => props.$isOverlapping ? 'scale(1.02)' : 'translateX(-2px)'};
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.85));
        z-index: 10;
    }

    &:active {
        transform: scale(0.96);
        box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
    }

    @media (max-width: 768px) {
        min-height: 44px;
        padding: ${props => props.$isOverlapping ? '6px 8px' : '8px 10px'};
        border-left-width: 4px;
    }
`;

const AppointmentBlockContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
`;

const AppointmentPetName = styled.div`
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

const AppointmentBlockTime = styled.div`
    font-size: 0.65rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    line-height: 1.2;

    @media (max-width: 768px) {
        font-size: 0.7rem;
    }
`;

const CurrentTimeIndicator = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    top: ${props => props.$top}px;
    z-index: 10;
    display: flex;
    align-items: center;
    pointer-events: none;
`;

const CurrentTimeDot = styled.div`
    width: 10px;
    height: 10px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    flex-shrink: 0;
    margin-left: -5px;
`;

const CurrentTimeLine = styled.div`
    flex: 1;
    height: 2px;
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
`;

// Modern Birthday Card
const ModernBirthdayCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease;

    @media (max-width: 768px) {
        padding: 20px 16px;
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
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @media (max-width: 768px) {
        padding: 0;
        align-items: flex-end;
    }
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
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @media (max-width: 768px) {
        max-width: 100%;
        max-height: 85vh;
        border-radius: 20px 20px 0 0;
        border-bottom: none;
        animation: slideUpMobile 0.3s ease;

        @keyframes slideUpMobile {
            from {
                transform: translateY(100%);
            }
            to {
                transform: translateY(0);
            }
        }
    }
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
    padding: 8px 12px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;

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

// Pet Info Modal Components
const PetInfoModalContent = styled.div`
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
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @media (max-width: 768px) {
        max-width: 100%;
        max-height: 85vh;
        border-radius: 20px 20px 0 0;
        border-bottom: none;
        animation: slideUpMobile 0.3s ease;

        @keyframes slideUpMobile {
            from {
                transform: translateY(100%);
            }
            to {
                transform: translateY(0);
            }
        }
    }
`;

const PetInfoContent = styled.div`
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }
`;

const PetInfoSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PetInfoLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PetInfoValue = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1.5;
`;

const PetInfoBadge = styled.div`
    display: inline-flex;
    align-items: center;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Poppins', sans-serif;
    width: fit-content;
`;

const PetInfoActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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