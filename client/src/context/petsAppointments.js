import React, { useState, useEffect } from "react";

const PetsAppointmentsContext = React.createContext();

function PetsAppointmentsProvider({ children }) {

    const [petsAppointments, setPetsAppointments] = useState(null)

    useEffect(() => {
        fetch("/pets_appointments").then((response) => {
            if (response.ok) {
                response.json().then((appointments) => setPetsAppointments(appointments));
            }
        });
    }, []);

    return <PetsAppointmentsContext.Provider value={{ petsAppointments, setPetsAppointments }}>{children}</PetsAppointmentsContext.Provider>
}

export { PetsAppointmentsContext, PetsAppointmentsProvider };