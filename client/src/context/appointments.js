import React, { useState, useEffect, createContext } from "react";
import dayjs from 'dayjs';

const AppointmentsContext = createContext();

const isTodayOrRecurring = (appointment) => {
    const today = dayjs().format('YYYY-MM-DD');
    const dayOfWeek = dayjs().day();

    if (appointment.canceled) return false;

    let noCancellationToday = true;
    if (appointment.cancellations) {
        for (const cancellation of appointment.cancellations) {
            if (dayjs(cancellation.date).format('YYYY-MM-DD') === today) {
                noCancellationToday = false;
                break;
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

const AppointmentsProvider = ({ children }) => {
    const [todaysAppointments, setTodaysAppointments] = useState([]);
    const [petsAppointments, setPetsAppointments] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await fetch("/appointments");
                if (!response.ok) throw new Error('Failed to fetch appointments');
                const appointments = await response.json();
                const filteredAppointments = appointments.filter(isTodayOrRecurring);
                const sortedAppointments = filteredAppointments.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
                setTodaysAppointments(sortedAppointments);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false); // Set loading to false after fetch
            }
        };
        fetchAppointments();
    }, []);

    useEffect(() => {
        const fetchPetsAppointments = async () => {
            try {
                const response = await fetch("/pets_appointments");
                if (!response.ok) throw new Error('Failed to fetch pets appointments');
                const appointments = await response.json();
                setPetsAppointments(appointments);
            } catch (error) {
                console.error('Error fetching pets appointments:', error);
            }
        };
        fetchPetsAppointments();
    }, []);

    return (
        <AppointmentsContext.Provider value={{ todaysAppointments, petsAppointments, setTodaysAppointments, setPetsAppointments, loading }}>
            {children}
        </AppointmentsContext.Provider>
    );
};

export { AppointmentsContext, AppointmentsProvider };
