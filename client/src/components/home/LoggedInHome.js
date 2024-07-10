import React, { useContext, useState } from "react";
import { AppointmentsContext } from "../../context/appointments";
import { UserContext } from "../../context/user";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Rates from "./Rates";
import dayjs from 'dayjs';

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

    const futureAppointments = getAppointmentsForDate(selectedDate);

    return (
        <div>
            <h1 className="display-4 m-3">Welcome, {user.name}</h1>
            <Card className="m-2">
                <Card.Header as="h5">Your Schedule</Card.Header>
                <Card.Body>
                    {todaysAppointments?.length === 0 && (
                        <Card.Title>You have no appointments scheduled for today.</Card.Title>
                    )}
                    {todaysAppointments?.length === 1 && (
                        <Card.Title>You have {todaysAppointments?.length} appointment today.</Card.Title>
                    )}
                    {todaysAppointments?.length > 1 && (
                        <Card.Title>You have {todaysAppointments?.length} appointments today.</Card.Title>
                    )}
                    <Card.Text>
                        Visit the Today page to mark them as completed as you finish them. Invoices will be created upon walk completion.
                    </Card.Text>
                    <Card.Title>View future dates</Card.Title>
                    <Card.Text>
                        Select a date in the future to see what walks are scheduled for that date.
                    </Card.Text>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control mb-3"
                    />
                    <ListGroup>
                        {futureAppointments.length === 0 && (
                            <ListGroup.Item>No walks scheduled for the selected date.</ListGroup.Item>
                        )}
                        {futureAppointments.length > 0 && (
                            futureAppointments.map((appointment, index) => (
                                <ListGroup.Item key={index} className="appointment-item">
                                    <div><strong>Pet:</strong> {appointment.pet.name}</div>
                                    <div><strong>Time:</strong> {dayjs(appointment.start_time).format('h:mm A')} - {dayjs(appointment.end_time).format('h:mm A')}</div>
                                    <div><strong>Duration:</strong> {appointment.duration} minutes</div>
                                </ListGroup.Item>
                            ))
                        )}
                    </ListGroup>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Set Your Rates</Card.Header>
                <Card.Body>
                    <Card.Title>Your current rates for appointments.</Card.Title>
                    {user.thirty === null && user.fourty === null && user.sixty === null && (
                        <Card.Text>
                            You have not yet set your rates! This means walks will be defaulted to $22 for 30 minute walks, $28 for 45 minute walks, & $33 for 60 minute walks. Use the form below to update your rates.
                        </Card.Text>
                    )}
                    {user.thirty !== null && user.fourty !== null && user.sixty !== null && (
                        <Card.Text>
                            Use the form below to update your rates. This will be reflected on new invoices.
                        </Card.Text>
                    )}
                    <Rates user={user} updateUserRates={updateUserRates} />
                </Card.Body>
            </Card>
        </div>
    );
}
