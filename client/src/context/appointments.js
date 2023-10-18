import React, { useState, useEffect } from "react";

const TodaysAppointmentsContext = React.createContext();

function TodaysAppointmentsProvider({ children }) {

    const [appointments, setAppointments] = useState(null)

    useEffect(() => {
        fetch("/appointments").then((response) => {
            if (response.ok) {
                response.json().then((appointments) => setAppointments(appointments));
            }
        });
    }, []);

    return <TodaysAppointmentsContext.Provider value={{ appointments, setAppointments }}>{children}</TodaysAppointmentsContext.Provider>
}

export { TodaysAppointmentsContext, TodaysAppointmentsProvider };