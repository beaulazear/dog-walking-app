import React, { useState, useEffect, createContext, useMemo, useCallback } from "react";

const UserContext = createContext();

function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        // If no token, user is not logged in
        if (!token) {
            setLoading(false);
            return;
        }

        // Use JWT token for auto-login
        fetch("/me", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setUser(data);
                    });
                } else {
                    // Invalid token - clear it
                    localStorage.removeItem("token");
                    setUser(null);
                }
            })
            .catch((error) => {
                console.error("Auto-login error:", error);
                localStorage.removeItem("token");
                setUser(null);
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

    // Add new pet sit without full state replacement
    const addPetSit = useCallback((newPetSit) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                pet_sits: [...(prevUser.pet_sits || []), newPetSit]
            };
        });
    }, []);

    // Update pet sit without full state replacement
    const updatePetSit = useCallback((updatedPetSit) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            const updatedPetSits = (prevUser.pet_sits || []).map(sit =>
                sit.id === updatedPetSit.id ? updatedPetSit : sit
            );

            return {
                ...prevUser,
                pet_sits: updatedPetSits
            };
        });
    }, []);

    // Remove pet sit without full state replacement
    const removePetSit = useCallback((petSitId) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            return {
                ...prevUser,
                pet_sits: (prevUser.pet_sits || []).filter(sit => sit.id !== petSitId)
            };
        });
    }, []);

    // Refresh user data from the server
    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.warn('No token found for refresh');
                setUser(null);
                return;
            }

            const response = await fetch("/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                // Invalid token - clear it
                localStorage.removeItem("token");
                setUser(null);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
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
        removePet,
        addPetSit,
        updatePetSit,
        removePetSit,
        refreshUser
    }), [user, loading, updateAppointment, addAppointment, removeAppointment, addInvoice, addPet, updatePet, removePet, addPetSit, updatePetSit, removePetSit, refreshUser]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}

export { UserContext, UserProvider };