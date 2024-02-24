import React, { useState, useEffect } from "react";

const PetsContext = React.createContext();

function PetsProvider({ children }) {

    const [pets, setPets] = useState(null)

    useEffect(() => {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    sortedPets = pets.sort()
                    setPets(sortedPets)
                });
            }
        });
    }, []);

    return <PetsContext.Provider value={{ pets, setPets }}>{children}</PetsContext.Provider>
}

export { PetsContext, PetsProvider };