import React, { useContext, useState } from "react";
import styled from "styled-components";
import { AppointmentsContext } from "../../context/appointments";
import { UserContext } from "../../context/user";
import Rates from "./Rates";
import dayjs from 'dayjs';

const Container = styled.div`
    background: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
`;

const Header = styled.h1`
    font-size: 2em;
    margin: 5px;
    margin-bottom: 15px;
    text-align: center;
    color: #6c757d;
`;

const StyledCard = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin: 5px;
    padding: 20px;
`;

const CardHeader = styled.h5`
    font-size: 1.5em;
    color: #343a40;
`;

const CardBody = styled.div`
    margin-top: 1em;
`;

const CardTitle = styled.h6`
    font-size: 1.25em;
    color: #495057;
    margin: 10px;
`;

const CardText = styled.p`
    color: #6c757d;
`;

const DateInput = styled.input`
    width: 100%;
    padding: 10px;
    margin-top: 1em;
    border-radius: 4px;
    border: 1px solid #ced4da;
`;

const ListGroup = styled.ul`
    list-style: none;
    padding: 0;
`;

const ListGroupItem = styled.li`
    background: #e9ecef;
    border-radius: 4px;
    margin-bottom: 10px;
    padding: 15px;
`;

const AppointmentItem = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 1em;
    color: #495057;
    margin: 0.5em 0;
`;

export default function LoggedInHome() {
    const { todaysAppointments, petsAppointments } = useContext(AppointmentsContext);
    const { user, setUser } = useContext(UserContext);

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

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
            <StyledCard>
                <CardHeader>Your Schedule</CardHeader>
                <CardBody>
                    <CardText>
                        Visit the Today page to complete walks. Invoices will be generated automatically. Select a future date below to see scheduled walks.
                    </CardText>
                    <DateInput
                        style={{ marginBottom: '5px', marginTop: '2px' }}
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
            </StyledCard>
            <StyledCard>
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
            </StyledCard>
        </Container>
    );
}
