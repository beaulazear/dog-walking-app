import React, { useState, useEffect, useCallback } from "react";

const PetsContext = React.createContext();

function PetsProvider({ children }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state

    const sortObjectsByName = (objects) => {
        return objects.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        });
    };

    const refreshPets = useCallback(() => {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    const sortedPets = sortObjectsByName(pets);
                    setPets(sortedPets);
                });
            }
        }).finally(() => setLoading(false)); // Set loading to false after fetch
    }, []);

    useEffect(() => {
        refreshPets();
    }, [refreshPets]);

    return (
        <PetsContext.Provider value={{ pets, setPets, refreshPets, loading }}>
            {children}
        </PetsContext.Provider>
    );
}

export { PetsContext, PetsProvider };
