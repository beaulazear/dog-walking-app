import React, { useState, useEffect, createContext } from "react";

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

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export { UserContext, UserProvider };