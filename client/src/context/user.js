import React, { useState, useEffect } from "react";

const UserContext = React.createContext();

function UserProvider({ children }) {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/me")
            .then((response) => {
                if (response.ok) {
                    response.json().then((user) => setUser(user));
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
