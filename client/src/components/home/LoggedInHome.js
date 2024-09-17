import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import { AppointmentsContext } from "../../context/appointments";
import { UserContext } from "../../context/user";
import Rates from "./Rates";
import dayjs from 'dayjs';
import { PetsContext } from "../../context/pets";

const Container = styled.div`
    background: #f4f7f9;
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.h1`
    font-size: 2rem;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    margin: 20px 0;
    padding: 20px;
    width: 100%;
    max-width: 900px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    }
`;

const CardHeader = styled.h2`
    font-size: 1.75rem;
    color: #007bff;
    margin-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
    padding-bottom: 10px;
`;

const CardBody = styled.div`
    margin-top: 15px;
`;

const CardTitle = styled.h3`
    font-size: 1.25rem;
    color: #495057;
    margin: 15px 0;
`;

const CardText = styled.p`
    color: #6c757d;
    margin-bottom: 20px;
    line-height: 1.6;
`;

const DateInput = styled.input`
    width: 100%;
    padding: 12px;
    margin: 15px 0;
    border-radius: 8px;
    border: 1px solid #ced4da;
    box-sizing: border-box;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    &:focus {
        border-color: #007bff;
        outline: none;
    }
`;

const ListGroup = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const ListGroupItem = styled.li`
    background: #ffffff;
    border-radius: 8px;
    margin-bottom: 15px;
    padding: 15px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const AppointmentItem = styled.div`
    flex: 1;
    font-size: 1rem;
    color: #495057;
    margin-left: 15px;
`;

const BirthdayAlert = styled.div`
    background: #d1ecf1;
    color: #0c5460;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    font-size: 1.25rem;
    max-width: 900px;
    width: 100%;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    text-align: center;
`;

const PetImage = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
`;

const getUpcomingBirthday = (pets) => {
    const today = dayjs();
    let closestBirthdayPet = null;
    let minDaysUntilBirthday = Infinity;

    pets.forEach(pet => {
        if (pet.birthdate) {
            const birthdate = dayjs(pet.birthdate);
            const birthdayThisYear = birthdate.year(today.year());
            const daysUntilBirthday = birthdayThisYear.diff(today, 'day');

            if (daysUntilBirthday < 0) {
                const birthdayNextYear = birthdayThisYear.add(1, 'year');
                const daysUntilNextBirthday = birthdayNextYear.diff(today, 'day');
                if (daysUntilNextBirthday < minDaysUntilBirthday) {
                    minDaysUntilBirthday = daysUntilNextBirthday;
                    closestBirthdayPet = pet;
                }
            } else if (daysUntilBirthday < minDaysUntilBirthday) {
                minDaysUntilBirthday = daysUntilBirthday;
                closestBirthdayPet = pet;
            }
        }
    });

    return closestBirthdayPet;
};

export default function LoggedInHome() {
    const { todaysAppointments, petsAppointments } = useContext(AppointmentsContext);
    const { user, setUser } = useContext(UserContext);
    const { pets } = useContext(PetsContext);

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);

    useEffect(() => {
        if (pets) {
            const petWithUpcomingBirthday = getUpcomingBirthday(pets);
            setUpcomingBirthdayPet(petWithUpcomingBirthday);
        }
    }, [pets]);

    const updateUserRates = (rates) => {
        setUser({ ...user, ...rates });
        window.alert("Rates have been updated!");
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

    const hasNoCancellationsOnDate = (appointment, date) => {
        if (!appointment.cancellations) return true;
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        for (const cancellation of appointment.cancellations) {
            if (dayjs(cancellation.date).format('YYYY-MM-DD') === formattedDate) {
                return false;
            }
        }
        return true;
    };

    const getAppointmentsForDate = (date) => {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        return petsAppointments?.filter(appointment => {
            if (appointment.canceled) return false;
            if (!hasNoCancellationsOnDate(appointment, formattedDate)) return false;
            if (appointment.recurring) {
                return isRecurringOnDate(appointment, formattedDate);
            } else {
                const appointmentDate = dayjs(appointment.appointment_date).format('YYYY-MM-DD');
                return appointmentDate === formattedDate;
            }
        }) || [];
    };

    const futureAppointments = getAppointmentsForDate(selectedDate).sort((a, b) => {
        return dayjs(a.start_time).isAfter(dayjs(b.start_time)) ? 1 : -1;
    });

    return (
        <Container>
            <Header>Welcome, {user.name}</Header>
            <Card>
                <CardHeader>Schedule Overview</CardHeader>
                <CardBody>
                    <CardText>
                        Check today's page to manage walks and view invoices. Select a date to view future appointments.
                    </CardText>
                    <DateInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <CardTitle><strong>Appointments: {futureAppointments.length}</strong></CardTitle>
                    <ListGroup>
                        {futureAppointments.length === 0 ? (
                            <ListGroupItem>No scheduled walks for this date.</ListGroupItem>
                        ) : (
                            futureAppointments.map((appointment, index) => (
                                <ListGroupItem key={index}>
                                    <PetImage src={appointment.pet.profile_pic} alt={appointment.pet.name} />
                                    <AppointmentItem>
                                        <div><strong>Pet:</strong> {appointment.pet.name}</div>
                                        <div><strong>Time:</strong> {dayjs(appointment.start_time).format('h:mm A')} - {dayjs(appointment.end_time).format('h:mm A')}</div>
                                        <div><strong>Duration:</strong> {appointment.duration} mins</div>
                                    </AppointmentItem>
                                </ListGroupItem>
                            ))
                        )}
                    </ListGroup>
                </CardBody>
            </Card>
            {upcomingBirthdayPet && (
                <BirthdayAlert>
                    <strong>Upcoming Birthday:</strong> {upcomingBirthdayPet.name}'s birthday is on {dayjs(upcomingBirthdayPet.birthdate).format('MMMM D')}!
                </BirthdayAlert>
            )}
            <Card>
                <CardHeader>Rate Settings</CardHeader>
                <CardBody>
                    {user.thirty === null && user.fourty === null && user.sixty === null ? (
                        <CardText>
                            Your rates are not set. Default rates will apply. Update them below.
                        </CardText>
                    ) : (
                        <CardText>
                            Update your rates below. These will be reflected in new invoices.
                        </CardText>
                    )}
                    <Rates user={user} updateUserRates={updateUserRates} />
                </CardBody>
            </Card>
        </Container>
    );
}


