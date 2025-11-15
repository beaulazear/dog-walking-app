import React, { useContext, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import {
    Cake,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
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
    const { user } = useContext(UserContext);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const dayDetailRef = React.useRef(null);

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

    const navigateMonth = (direction) => {
        setCurrentDate(prev => prev.add(direction * 1, 'month'));
    };

    const handleDayClick = (day, appointments) => {
        if (appointments.length > 0) {
            setSelectedDate(day);
            setShowDayDetail(true);
        }
    };

    const closeDayDetail = () => {
        setShowDayDetail(false);
        setTimeout(() => setSelectedDate(null), 300); // Delay to allow animation
    };

    const navigateDay = (direction) => {
        setSelectedDate(prev => prev.add(direction, 'day'));
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
                        <ProfileBadgesRow>
                            {(() => {
                                const todayWalks = getAppointmentsForDate(dayjs().format("YYYY-MM-DD"));
                                return todayWalks.length > 0 ? (
                                    <TodayWalksCount>
                                        {todayWalks.length} walk{todayWalks.length !== 1 ? 's' : ''} today
                                    </TodayWalksCount>
                                ) : null;
                            })()}
                            {upcomingBirthdayPet && (
                                <BirthdayBadge>
                                    <Cake size={12} />
                                    {upcomingBirthdayPet.name}'s birthday {(() => {
                                        const days = dayjs(upcomingBirthdayPet.upcomingBirthday).diff(dayjs(), 'day');
                                        if (days === 0) return "today!";
                                        if (days === 1) return "tomorrow!";
                                        return `in ${days} days`;
                                    })()}
                                </BirthdayBadge>
                            )}
                        </ProfileBadgesRow>
                    </ProfileInfo>
                </ProfileHeader>

                <MonthCalendarSection>
                    <MonthHeader>
                        <MonthTitle>
                            {currentDate.format('MMMM YYYY')}
                        </MonthTitle>
                        <MonthNavButtons>
                            <MonthNavButton onClick={() => navigateMonth(-1)}>
                                <ChevronLeft size={20} />
                            </MonthNavButton>
                            <TodayButton onClick={() => setCurrentDate(dayjs())}>
                                Today
                            </TodayButton>
                            <MonthNavButton onClick={() => navigateMonth(1)}>
                                <ChevronRight size={20} />
                            </MonthNavButton>
                        </MonthNavButtons>
                    </MonthHeader>

                    <CalendarWrapper>
                        <DayNamesRow>
                            <DayNameCell>Sun</DayNameCell>
                            <DayNameCell>Mon</DayNameCell>
                            <DayNameCell>Tue</DayNameCell>
                            <DayNameCell>Wed</DayNameCell>
                            <DayNameCell>Thu</DayNameCell>
                            <DayNameCell>Fri</DayNameCell>
                            <DayNameCell>Sat</DayNameCell>
                        </DayNamesRow>

                        <MonthGrid>
                            {getMonthDays(currentDate).map((day) => {
                                const dayAppointments = getAppointmentsForDate(day.format("YYYY-MM-DD"));
                                const isToday = day.isSame(dayjs(), 'day');
                                const isCurrentMonth = day.isSame(currentDate, 'month');
                                const displayedAppointments = dayAppointments.slice(0, 2);
                                const remainingCount = dayAppointments.length - 2;

                                return (
                                    <DayCell
                                        key={day.format("YYYY-MM-DD")}
                                        $isToday={isToday}
                                        $isCurrentMonth={isCurrentMonth}
                                        $hasAppointments={dayAppointments.length > 0}
                                        onClick={() => handleDayClick(day, dayAppointments)}
                                    >
                                        <DayNumber $isToday={isToday}>
                                            {day.format('D')}
                                        </DayNumber>
                                        <AppointmentIndicators $hasAppointments={dayAppointments.length > 0}>
                                            {dayAppointments.length > 0 && (
                                                <>
                                                    <AppointmentDots>
                                                        {dayAppointments.slice(0, 3).map((apt, idx) => (
                                                            <DotIndicator key={`${apt.id}-${idx}`} />
                                                        ))}
                                                    </AppointmentDots>
                                                    {dayAppointments.length > 3 && (
                                                        <ExtraCount>+{dayAppointments.length - 3}</ExtraCount>
                                                    )}
                                                </>
                                            )}
                                        </AppointmentIndicators>
                                        <DesktopPreviewList>
                                            {displayedAppointments.map((apt, idx) => (
                                                <AppointmentPreview key={`${apt.id}-${idx}`}>
                                                    <PreviewDot />
                                                    <PreviewText>
                                                        {dayjs(apt.start_time, "HH:mm").format("h:mm A")} {apt.pet?.name}
                                                    </PreviewText>
                                                </AppointmentPreview>
                                            ))}
                                            {remainingCount > 0 && (
                                                <MoreWalks>
                                                    +{remainingCount} more
                                                </MoreWalks>
                                            )}
                                        </DesktopPreviewList>
                                    </DayCell>
                                );
                            })}
                        </MonthGrid>
                    </CalendarWrapper>
                </MonthCalendarSection>
            </ContentSections>

            {/* Day Detail Feed - Full Screen View */}
            {showDayDetail && selectedDate && (
                <DayDetailFullScreen $show={showDayDetail}>
                    <DayDetailHeader>
                        <BackButton onClick={closeDayDetail}>
                            <ArrowLeft size={24} />
                        </BackButton>
                        <DayDetailDateInfo>
                            <DayDetailDayName>{selectedDate.format('dddd')}</DayDetailDayName>
                            <DayDetailDate>{selectedDate.format('MMMM D, YYYY')}</DayDetailDate>
                        </DayDetailDateInfo>
                        <DateNavButtons>
                            <DateNavButton onClick={() => navigateDay(-1)}>
                                <ChevronLeft size={20} />
                            </DateNavButton>
                            <DateNavButton onClick={() => navigateDay(1)}>
                                <ChevronRight size={20} />
                            </DateNavButton>
                        </DateNavButtons>
                    </DayDetailHeader>

                    <DayDetailContent>
                        {getAppointmentsForDate(selectedDate.format("YYYY-MM-DD")).length > 0 ? (
                            getAppointmentsForDate(selectedDate.format("YYYY-MM-DD")).map((appointment, index) => (
                                <WalkCard key={`${appointment.id}-${index}`}>
                                    <WalkTimeColumn>
                                        <WalkTime>{dayjs(appointment.start_time, "HH:mm").format("h:mm")}</WalkTime>
                                        <WalkTimePeriod>{dayjs(appointment.start_time, "HH:mm").format("A")}</WalkTimePeriod>
                                    </WalkTimeColumn>
                                    <WalkDivider />
                                    <WalkInfoColumn>
                                        <WalkPetName>{appointment.pet?.name}</WalkPetName>
                                        <WalkMeta>
                                            <WalkMetaItem>
                                                {dayjs(appointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(appointment.end_time, "HH:mm").format("h:mm A")}
                                            </WalkMetaItem>
                                            <WalkMetaDivider>•</WalkMetaDivider>
                                            <WalkMetaItem>{appointment.duration} min</WalkMetaItem>
                                        </WalkMeta>
                                        {appointment.pet?.address && (
                                            <WalkAddress>{appointment.pet.address}</WalkAddress>
                                        )}
                                        {appointment.recurring && (
                                            <RecurringBadge>Recurring</RecurringBadge>
                                        )}
                                    </WalkInfoColumn>
                                </WalkCard>
                            ))
                        ) : (
                            <EmptyState>
                                <EmptyStateText>No walks scheduled for this day</EmptyStateText>
                            </EmptyState>
                        )}
                    </DayDetailContent>
                </DayDetailFullScreen>
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 0 2rem;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;

    @media (max-width: 768px) {
        padding: 0 1.5rem;
    }

    @media (max-width: 480px) {
        padding: 0 1rem;
    }
`;

const HeaderLogo = styled.img`
    height: 85px;
    width: auto;
    max-width: 450px;
    display: block;
    filter: brightness(0) saturate(100%) invert(95%) sepia(5%) saturate(200%) hue-rotate(180deg) brightness(105%) contrast(90%);

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
        padding: 16px 12px;
        gap: 12px;
    }

    @media (max-width: 480px) {
        padding: 14px 10px;
        gap: 10px;
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

const ProfileBadgesRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 2px;

    @media (max-width: 768px) {
        gap: 6px;
    }
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

    @media (max-width: 768px) {
        font-size: 0.7rem;
        padding: 3px 8px;
    }
`;

const BirthdayBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
    border: 1px solid rgba(251, 191, 36, 0.3);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Poppins', sans-serif;
    width: fit-content;

    svg {
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        font-size: 0.7rem;
        padding: 3px 8px;
        gap: 4px;

        svg {
            width: 11px;
            height: 11px;
        }
    }
`;

// Month Calendar Section
const MonthCalendarSection = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 20px;
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
        padding: 12px 0;
    }

    @media (max-width: 480px) {
        padding: 10px 0;
    }
`;

const MonthHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    @media (max-width: 768px) {
        margin-bottom: 12px;
        gap: 12px;
        padding: 0 12px;
    }

    @media (max-width: 480px) {
        margin-bottom: 10px;
        gap: 8px;
        padding: 0 10px;
    }
`;

const MonthTitle = styled.h2`
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;

    @media (max-width: 768px) {
        font-size: 1.25rem;
    }
`;

const MonthNavButtons = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const MonthNavButton = styled.button`
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    &:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.25);
    }

    @media (max-width: 768px) {
        width: 42px;
        height: 42px;

        svg {
            width: 22px;
            height: 22px;
        }
    }
`;

const TodayButton = styled.button`
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 8px 16px;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Poppins', sans-serif;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    min-height: 36px;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
    }

    &:active {
        transform: scale(0.98);
        background: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 768px) {
        padding: 10px 18px;
        font-size: 0.9rem;
        min-height: 42px;
    }
`;

const CalendarWrapper = styled.div`
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);

    @media (max-width: 768px) {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const DayNamesRow = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const DayNameCell = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    padding: 12px 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
        font-size: 0.65rem;
        padding: 8px 2px;
        letter-spacing: 0.3px;
    }

    @media (max-width: 480px) {
        font-size: 0.6rem;
        padding: 6px 1px;
        letter-spacing: 0.2px;
    }

    @media (max-width: 375px) {
        font-size: 0.58rem;
        padding: 6px 1px;
        letter-spacing: 0.1px;
    }
`;

const MonthGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.05);
    padding: 1px;

    @media (max-width: 768px) {
        gap: 0.5px;
        padding: 0;
    }
`;

const DayCell = styled.div`
    background: ${props => {
        if (props.$isToday) return 'rgba(59, 130, 246, 0.15)';
        return props.$isCurrentMonth ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)';
    }};
    min-height: 100px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: ${props => props.$isCurrentMonth ? 1 : 0.4};
    cursor: ${props => props.$hasAppointments ? 'pointer' : 'default'};
    transition: all 0.2s ease;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;

    &:hover {
        background: ${props => {
            if (props.$hasAppointments) {
                return props.$isToday ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            }
            return props.$isToday ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)';
        }};
    }

    &:active {
        ${props => props.$hasAppointments && `
            background: ${props.$isToday ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.12)'};
            transform: scale(0.98);
        `}
    }

    @media (max-width: 768px) {
        min-height: 70px;
        padding: 4px 2px;
        gap: 2px;
    }

    @media (max-width: 480px) {
        min-height: 65px;
        padding: 4px 1px;
        gap: 2px;
    }

    @media (max-width: 375px) {
        min-height: 60px;
        padding: 3px 1px;
        gap: 1px;
    }
`;

const DayNumber = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: ${props => props.$isToday ? '1.1rem' : '1rem'};
    font-weight: ${props => props.$isToday ? '700' : '600'};
    color: ${props => props.$isToday ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
    ${props => props.$isToday && `
        background: rgba(59, 130, 246, 0.5);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    `}
    margin-bottom: 4px;

    @media (max-width: 768px) {
        font-size: ${props => props.$isToday ? '0.95rem' : '0.85rem'};
        ${props => props.$isToday && `
            width: 24px;
            height: 24px;
        `}
        margin-bottom: 2px;
    }

    @media (max-width: 480px) {
        font-size: ${props => props.$isToday ? '0.9rem' : '0.8rem'};
        ${props => props.$isToday && `
            width: 22px;
            height: 22px;
        `}
        margin-bottom: 2px;
    }

    @media (max-width: 375px) {
        font-size: ${props => props.$isToday ? '0.85rem' : '0.75rem'};
        ${props => props.$isToday && `
            width: 20px;
            height: 20px;
        `}
        margin-bottom: 1px;
    }
`;

// Mobile: Dot indicators (Apple Calendar style)
const AppointmentIndicators = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        min-height: 20px;
    }
`;

const AppointmentDots = styled.div`
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
`;

const DotIndicator = styled.div`
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 3px rgba(34, 197, 94, 0.6);

    @media (max-width: 480px) {
        width: 4px;
        height: 4px;
    }
`;

const ExtraCount = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);

    @media (max-width: 480px) {
        font-size: 0.6rem;
    }
`;

// Desktop: Text previews
const DesktopPreviewList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
    width: 100%;

    @media (max-width: 768px) {
        display: none;
    }
`;

const AppointmentPreview = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.85);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    line-height: 1.4;

    @media (max-width: 768px) {
        font-size: 0.68rem;
        gap: 4px;
    }

    @media (max-width: 480px) {
        font-size: 0.65rem;
        gap: 3px;
    }

    @media (max-width: 375px) {
        font-size: 0.62rem;
        gap: 3px;
        line-height: 1.3;
    }
`;

const PreviewDot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);

    @media (max-width: 480px) {
        width: 5px;
        height: 5px;
    }
`;

const PreviewText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
`;

const MoreWalks = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 2px;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    width: fit-content;

    @media (max-width: 768px) {
        font-size: 0.66rem;
        padding: 2px 5px;
    }

    @media (max-width: 480px) {
        font-size: 0.64rem;
        padding: 1px 4px;
    }

    @media (max-width: 375px) {
        font-size: 0.62rem;
        padding: 1px 4px;
        margin-top: 1px;
    }
`;

// Day Detail Full Screen View
const DayDetailFullScreen = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 3000;
    display: flex;
    flex-direction: column;
    opacity: ${props => props.$show ? 1 : 0};
    transform: ${props => props.$show ? 'translateX(0)' : 'translateX(100%)'};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

const DayDetailHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
        padding: 16px 20px;
    }
`;

const BackButton = styled.button`
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: #ffffff;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    min-width: 40px;
    min-height: 40px;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
    }

    &:active {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0.95);
    }

    @media (max-width: 768px) {
        min-width: 44px;
        min-height: 44px;
    }
`;

const DateNavButtons = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const DateNavButton = styled.button`
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    &:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.25);
    }

    @media (max-width: 768px) {
        width: 42px;
        height: 42px;

        svg {
            width: 22px;
            height: 22px;
        }
    }
`;

const DayDetailDateInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const DayDetailDayName = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;

    @media (max-width: 768px) {
        font-size: 1.3rem;
    }
`;

const DayDetailDate = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
`;

const DayDetailContent = styled.div`
    padding: 0;
    margin-top: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    position: relative;
    z-index: 1;

    &::-webkit-scrollbar {
        width: 8px;
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
        margin-top: 20px;
        padding-bottom: calc(env(safe-area-inset-bottom));
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
`;

const EmptyStateText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
`;

// Walk Card (Apple Calendar-inspired)
const WalkCard = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 0;
    padding: 20px 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    transition: all 0.2s ease;
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    min-height: 80px;

    &:first-child {
        border-top: 2px solid rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 768px) {
        padding: 20px 16px;
        gap: 14px;
        min-height: 88px;
    }

    @media (max-width: 480px) {
        padding: 18px 16px;
        gap: 12px;
        min-height: 84px;
    }
`;

const WalkTimeColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    min-width: 50px;
`;

const WalkTime = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;

    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const WalkTimePeriod = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);

    @media (max-width: 768px) {
        font-size: 0.8rem;
    }
`;

const WalkDivider = styled.div`
    width: 3px;
    height: 100%;
    min-height: 40px;
    background: linear-gradient(to bottom, #22c55e, #16a34a);
    border-radius: 2px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        width: 4px;
        min-height: 48px;
    }
`;

const WalkInfoColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
        gap: 6px;
    }
`;

const WalkPetName = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;

    @media (max-width: 768px) {
        font-size: 1.15rem;
    }

    @media (max-width: 480px) {
        font-size: 1.1rem;
    }
`;

const WalkMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }

    @media (max-width: 480px) {
        font-size: 0.8rem;
    }
`;

const WalkMetaItem = styled.span`
`;

const WalkMetaDivider = styled.span`
    color: rgba(255, 255, 255, 0.3);
`;

const WalkAddress = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }

    @media (max-width: 480px) {
        font-size: 0.8rem;
    }
`;

const RecurringBadge = styled.div`
    display: inline-flex;
    align-items: center;
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    width: fit-content;
    margin-top: 2px;

    @media (max-width: 768px) {
        font-size: 0.75rem;
        padding: 5px 10px;
    }
`;

