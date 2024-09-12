import React, { useState, useEffect } from "react";

const PetsContext = React.createContext();

function PetsProvider({ children }) {

    const [pets, setPets] = useState([])

    function sortObjectsByName(objects) {
        return objects.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
    }


    useEffect(() => {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    const sortedPets = sortObjectsByName(pets)
                    setPets(sortedPets)
                });
            }
        });
    }, []);

    return <PetsContext.Provider value={{ pets, setPets }}>{children}</PetsContext.Provider>
}

export { PetsContext, PetsProvider };