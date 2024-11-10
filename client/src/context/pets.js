import React, { useState, useEffect } from "react";

const PetsContext = React.createContext();

function PetsProvider({ children }) {
    const [pets, setPets] = useState([]);

    function sortObjectsByName(objects) {
        return objects.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        });
    }

    function refreshPets() {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    const sortedPets = sortObjectsByName(pets);
                    setPets(sortedPets);
                });
            }
        });
    }

    useEffect(() => {
        refreshPets();
    }, []);

    return (
        <PetsContext.Provider value={{ pets, setPets, refreshPets }}>
            {children}
        </PetsContext.Provider>
    );
}


export { PetsContext, PetsProvider };