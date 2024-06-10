import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';

const TodaysAppointmentsContext = React.createContext();

const isTodayOrRecurring = (appointment) => {
    const today = dayjs().format('YYYY-MM-DD');
    const dayOfWeek = dayjs().day();

    if (appointment.canceled) {
        return false;
    }

    let noCancellationToday = true;
    if (appointment.cancellations) {
        for (const cancellation of appointment.cancellations) {
            if (dayjs(cancellation).format('YYYY-MM-DD') === today) {
                noCancellationToday = false;
                break; // Exit the loop since we found a cancellation for today
            }
        }
    }

    if (!appointment.recurring) {
        if (appointment.appointment_date) {
            const appointmentDate = dayjs(appointment.appointment_date).format('YYYY-MM-DD');
            return appointmentDate === today && noCancellationToday;
        }
        return false;
    } else if (appointment.recurring) {
        const recurringDays = {
            0: appointment.sunday,
            1: appointment.monday,
            2: appointment.tuesday,
            3: appointment.wednesday,
            4: appointment.thursday,
            5: appointment.friday,
            6: appointment.saturday
        };
        return recurringDays[dayOfWeek] && noCancellationToday;
    }
    return false;
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
                const filteredAppointments = appointments.filter(isTodayOrRecurring);
                const sortedAppointments = filteredAppointments.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
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