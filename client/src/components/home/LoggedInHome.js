import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import { AppointmentsContext } from "../../context/appointments";
import { UserContext } from "../../context/user";
import Rates from "./Rates";
import dayjs from 'dayjs';
import { PetsContext } from "../../context/pets";

const Container = styled.div`
    background: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center; // Center everything horizontally
`;

const Header = styled.h1`
    font-size: 2rem;
    color: #343a40;
    margin-bottom: 10px;
    text-align: center; // Center header text
`;

const Card = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin: 15px 0;
    padding: 20px;
    max-width: 800px;
    width: 100%;
    transition: transform 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
    align-items: center; // Center content inside Card
`;


const CardHeader = styled.h5`
    font-size: 1.75rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const CardBody = styled.div`
    margin-top: 10px;
`;

const CardTitle = styled.h6`
    font-size: 1.5rem;
    color: #495057;
    margin: 10px 0;
`;

const CardText = styled.p`
    color: #6c757d;
    margin-bottom: 20px;
`;

const DateInput = styled.input`
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    border: 1px solid #ced4da;
    box-sizing: border-box;
`;

const ListGroup = styled.ul`
    list-style: none;
    padding: 0;
`;

const ListGroupItem = styled.li`
    background: #e9ecef;
    border-radius: 5px;
    margin-bottom: 12px;
    padding: 15px;
    display: flex;
    align-items: center; // Align image and text
`;

const AppointmentItem = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 1rem;
    color: #495057;
    margin: 0.5em 0;
    flex: 1; // Make sure text takes the remaining space
`;

const BirthdayAlert = styled.div`
    background: #d1ecf1; /* Light blue background */
    color: #0c5460; /* Darker blue text */
    padding: 20px;
    border-radius: 8px;
    margin: 15px 0;
    font-size: 1.2rem;
    max-width: 800px;
    width: 100%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center; // Center text inside BirthdayAlert
`;

const PetImage = styled.img`
    width: 50px; // Set a small size for the image
    height: 50px;
    border-radius: 50%;
    margin-right: 15px;
    object-fit: cover; // Ensure the image looks good even if resized
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
                // If birthday has already passed this year, calculate for next year
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
    const { user, setUser } = useContext(UserContext); // Added `pets` from context
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

    // for chat gpt below 
    return (
        <Container>
            <Header>{user.name}</Header>
            <Card>
                <CardHeader>Your Schedule</CardHeader>
                <CardBody>
                    <CardText>
                        Visit the Today page to complete walks and view auto-generated invoices. Select a future date to see scheduled walks.
                    </CardText>
                    <DateInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <CardTitle><b>Appointments: {futureAppointments.length}</b></CardTitle>
                    <ListGroup>
                        {futureAppointments.length === 0 && (
                            <ListGroupItem>No walks scheduled for the selected date.</ListGroupItem>
                        )}
                        {futureAppointments.length > 0 && (
                            futureAppointments.map((appointment, index) => (
                                <ListGroupItem key={index}>
                                    <PetImage src={appointment.pet.photo_url} alt={appointment.pet.name} />
                                    <AppointmentItem>
                                        <div><strong>Pet:</strong> {appointment.pet.name}</div>
                                        <div><strong>Time:</strong> {dayjs(appointment.start_time).format('h:mm A')} - {dayjs(appointment.end_time).format('h:mm A')}</div>
                                        <div><strong>Duration:</strong> {appointment.duration} minutes</div>
                                    </AppointmentItem>
                                </ListGroupItem>
                            ))
                        )}
                    </ListGroup>
                </CardBody>
            </Card>
            {upcomingBirthdayPet && (
                <BirthdayAlert>
                    <strong>Upcoming Birthday:</strong> {upcomingBirthdayPet.name}'s birthday is coming up on {dayjs(upcomingBirthdayPet.birthdate).format('MMMM D')}!
                </BirthdayAlert>
            )}
            <Card>
                <CardHeader>Set Your Rates</CardHeader>
                <CardBody>
                    {user.thirty === null && user.fourty === null && user.sixty === null && (
                        <CardText>
                            You have not yet set your rates! This means walks will be defaulted to $22 for 30 minute walks, $28 for 45 minute walks, & $33 for 60 minute walks. Use the form below to update your rates.
                        </CardText>
                    )}
                    {user.thirty !== null && user.fourty !== null && user.sixty !== null && (
                        <CardText>
                            Use the form below to update your rates. This will be reflected on new invoices.
                        </CardText>
                    )}
                    <Rates user={user} updateUserRates={updateUserRates} />
                </CardBody>
            </Card>
        </Container>
    );
}
