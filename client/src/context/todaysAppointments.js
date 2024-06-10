import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';

const TodaysAppointmentsContext = React.createContext();

const isTodayOrRecurring = (appointment) => {
    const today = dayjs();

    const datePart = appointment.appointment_date.slice(5, 7) + '/' + appointment.appointment_date.slice(8, 10) + '/' + appointment.appointment_date.slice(0, 4);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const hasCancellations = appointment.hasOwnProperty('cancellations');
    const isNotCanceled = !appointment.canceled;
    const noCancellationToday = hasCancellations ? !hasCancellationToday(appointment.cancellations) : true;

    if (!appointment.recurring && isNotCanceled) {
        return datePart === currentDate && noCancellationToday;
    } else if (appointment.recurring && isNotCanceled) {
        const dayOfWeek = today.day();
        switch (dayOfWeek) {
            case 0:
                return appointment.sunday === true && noCancellationToday;
            case 1:
                return appointment.monday === true && noCancellationToday;
            case 2:
                return appointment.tuesday === true && noCancellationToday;
            case 3:
                return appointment.wednesday === true && noCancellationToday;
            case 4:
                return appointment.thursday === true && noCancellationToday;
            case 5:
                return appointment.friday === true && noCancellationToday;
            case 6:
                return appointment.saturday === true && noCancellationToday;
            default:
                return false;
        }
    }
};

const hasCancellationToday = (cancellations) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return cancellations.some(cancellation => cancellation.slice(0, 10) === today);
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
