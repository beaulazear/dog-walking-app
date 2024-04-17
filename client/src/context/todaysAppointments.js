import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';

const TodaysAppointmentsContext = React.createContext();

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

    const isTodayOrRecurring = (appointment) => {
        const today = dayjs();

        const datePart = appointment.appointment_date.slice(5, 7) + '/' + appointment.appointment_date.slice(8, 10) + '/' + appointment.appointment_date.slice(0, 4);
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

        if (!appointment.recurring & !appointment.canceled) {
            return datePart === currentDate;
        } else if (appointment.recurring & !appointment.canceled) {
            const dayOfWeek = today.day();
            switch (dayOfWeek) {
                case 0:
                    return appointment.sunday === true;
                case 1:
                    return appointment.monday === true;
                case 2:
                    return appointment.tuesday === true;
                case 3:
                    return appointment.wednesday === true;
                case 4:
                    return appointment.thursday === true;
                case 5:
                    return appointment.friday === true;
                case 6:
                    return appointment.saturday === true;
                default:
                    return false;
            }
        }
    };

    return (
        <TodaysAppointmentsContext.Provider value={{ todaysAppointments, setTodaysAppointments }}>
            {children}
        </TodaysAppointmentsContext.Provider>
    );
}

export { TodaysAppointmentsContext, TodaysAppointmentsProvider };
