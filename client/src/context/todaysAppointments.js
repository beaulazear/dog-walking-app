import React, { useState, useEffect } from "react";

const TodaysAppointmentsContext = React.createContext();

function TodaysAppointmentsProvider({ children }) {

    const [todaysAppointments, setTodaysAppointments] = useState(null)

    useEffect(() => {
        fetch("/appointments").then((response) => {
            if (response.ok) {
                response.json().then((appointments) => setTodaysAppointments(appointments));
            }
        });
    }, []);

    return <TodaysAppointmentsContext.Provider value={{ todaysAppointments, setTodaysAppointments }}>{children}</TodaysAppointmentsContext.Provider>
}

export { TodaysAppointmentsContext, TodaysAppointmentsProvider };