import React, { useState, useEffect } from "react";

const InvoicesContext = React.createContext();

function InvoicesProvider({ children }) {

    const [invoices, setInvoices] = useState(null)

    useEffect(() => {
        fetch("/invoices").then((response) => {
            if (response.ok) {
                response.json().then((invoices) => setInvoices(invoices));
            }
        });
    }, []);

    return <InvoicesContext.Provider value={{ invoices, setInvoices }}>{children}</InvoicesContext.Provider>
}

export { InvoicesContext, InvoicesProvider };