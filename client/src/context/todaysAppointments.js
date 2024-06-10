import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';

const TodaysAppointmentsContext = React.createContext();

const isTodayOrRecurring = (appointment) => {
    const today = dayjs().format('YYYY-MM-DD');

    const hasCancellations = appointment.hasOwnProperty('cancellations');
    const isNotCanceled = !appointment.canceled;
    const noCancellationToday = hasCancellations ? !hasCancellationToday(appointment.cancellations) : true;

    if (!appointment.recurring && isNotCanceled) {
        if (appointment.appointment_date) {
            const appointmentDate = dayjs(appointment.appointment_date).format('YYYY-MM-DD');
            return appointmentDate === today && noCancellationToday;
        }
        return false;
    } else if (appointment.recurring && isNotCanceled && noCancellationToday) {
        const dayOfWeek = dayjs().day();
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
    }
    return false;
};

const hasCancellationToday = (cancellations) => {
    const today = dayjs().format('YYYY-MM-DD');
    return cancellations.some(cancellation => dayjs(cancellation).format('YYYY-MM-DD') === today);
};

function TodaysAppointmentsProvider({ children }) {
    const [todaysAppointments, setTodaysAppointments] = useState([]);

    useEffect(() => {
        fetch("/appointments")
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to fetch appointments');
                }
            })
            .then((appointments) => {
                const filteredAppointments = appointments.filter(appointment => {
                    return isTodayOrRecurring(appointment);
                });
                const sortedAppointments = filteredAppointments.sort((a, b) => {
                    return dayjs(a.start_time).diff(dayjs(b.start_time));
                });
                setTodaysAppointments(sortedAppointments);
            })
            .catch(error => console.error(error));
    }, []);

    return (
        <TodaysAppointmentsContext.Provider value={{ todaysAppointments, setTodaysAppointments }}>
            {children}
        </TodaysAppointmentsContext.Provider>
    );
}

export { TodaysAppointmentsContext, TodaysAppointmentsProvider };