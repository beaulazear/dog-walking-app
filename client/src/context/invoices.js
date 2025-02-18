import React, { useState, useEffect } from "react";

const InvoicesContext = React.createContext();

function InvoicesProvider({ children }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        fetch("/invoices").then((response) => {
            if (response.ok) {
                response.json().then((invoices) => setInvoices(invoices));
            }
        }).finally(() => setLoading(false)); // Set loading to false after fetch
    }, []);

    return <InvoicesContext.Provider value={{ invoices, setInvoices, loading }}>{children}</InvoicesContext.Provider>;
}

export { InvoicesContext, InvoicesProvider };
