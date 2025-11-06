import React, { useState, useEffect, createContext, useMemo, useCallback } from "react";

const UserContext = createContext();

function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/me")
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setUser(data);
                    });
                } else {
                    setUser(null);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    // Smart update helper for appointments - prevents full re-renders
    const updateAppointment = useCallback((updatedAppointment) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            const updatedAppointments = prevUser.appointments.map(apt =>
                apt.id === updatedAppointment.id ? updatedAppointment : apt
            );

            return {
                ...prevUser,
                appointments: updatedAppointments
            };
        });
    }, []);

    // Add new appointment without full state replacement
    const addAppointment = useCallback((newAppointment) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                appointments: [...prevUser.appointments, newAppointment]
            };
        });
    }, []);

    // Remove appointment without full state replacement
    const removeAppointment = useCallback((appointmentId) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                appointments: prevUser.appointments.filter(apt => apt.id !== appointmentId)
            };
        });
    }, []);

    // Add new invoice without full state replacement
    const addInvoice = useCallback((newInvoice) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                invoices: [...(prevUser.invoices || []), newInvoice]
            };
        });
    }, []);

    // Add new pet without full state replacement
    const addPet = useCallback((newPet) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                pets: [...prevUser.pets, newPet]
            };
        });
    }, []);

    // Update pet without full state replacement
    const updatePet = useCallback((updatedPet) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            const updatedPets = prevUser.pets.map(pet =>
                pet.id === updatedPet.id ? updatedPet : pet
            );

            return {
                ...prevUser,
                pets: updatedPets
            };
        });
    }, []);

    // Remove pet without full state replacement
    const removePet = useCallback((petId) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                pets: prevUser.pets.filter(pet => pet.id !== petId)
            };
        });
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        setUser,
        loading,
        updateAppointment,
        addAppointment,
        removeAppointment,
        addInvoice,
        addPet,
        updatePet,
        removePet
    }), [user, loading, updateAppointment, addAppointment, removeAppointment, addInvoice, addPet, updatePet, removePet]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}

export { UserContext, UserProvider };