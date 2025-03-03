import React, { useState, useContext } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";

const PetInvoices = ({ pet }) => {
    const { user, setUser } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState("unpaid");
    const [invoiceLimit, setInvoiceLimit] = useState(15);

    const petInvoices = user.invoices
        .filter(invoice => invoice.pet_id === pet.id);

    const sortByDateDesc = (a, b) => new Date(b.date_completed) - new Date(a.date_completed);

    const unpaidInvoices = petInvoices
        .filter(invoice => !invoice.paid)
        .sort(sortByDateDesc);


    const pastInvoices = petInvoices
        .filter(invoice => invoice.paid)
        .sort(sortByDateDesc)
        .slice(0, invoiceLimit === "all" ? undefined : invoiceLimit);


    const markAllAsPaid = async () => {
        if (!window.confirm("Mark all unpaid invoices for this pet as paid?")) return;

        const response = await fetch(`/invoices/paid`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_array: unpaidInvoices.map(i => i.id) })
        });

        if (response.ok) {
            const updatedInvoices = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                invoices: prevUser.invoices.map(inv =>
                    updatedInvoices.find(ui => ui.id === inv.id) || inv
                )
            }));
            alert("All invoices marked as paid!");
        }
    };

    const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.compensation, 0);

    return (
        <InvoicesContainer>
            <TabContainer>
                <TabButton $active={activeTab === "unpaid"} onClick={() => setActiveTab("unpaid")}>
                    Unpaid Invoices
                </TabButton>

                <TabButton $active={activeTab === "paid"} onClick={() => setActiveTab("paid")}>
                    Past Invoices
                </TabButton>
            </TabContainer>

            {activeTab === "unpaid" ? (
                <>
                    {unpaidInvoices.length === 0 ? (
                        <NoInvoices>No unpaid invoices.</NoInvoices>
                    ) : (
                        <>
                            {unpaidInvoices.map(invoice => (
                                <InvoiceCard key={invoice.id}>
                                    <Text><strong>{invoice.title}</strong></Text>
                                    <Text>${invoice.compensation} - {dayjs(invoice.date_completed).format("MMM D, YYYY")}</Text>
                                </InvoiceCard>
                            ))}
                            <Text>Total: ${totalUnpaid.toFixed(2)}</Text>
                            <MarkPaidButton onClick={markAllAsPaid}>Mark All as Paid</MarkPaidButton>
                        </>
                    )}
                </>
            ) : (
                <>
                    <InvoiceLimitSelector>
                        <Label>Show:</Label>
                        <Select value={invoiceLimit} onChange={(e) => setInvoiceLimit(e.target.value)}>
                            <option value={15}>15</option>
                            <option value={50}>50</option>
                            <option value="all">All</option>
                        </Select>
                    </InvoiceLimitSelector>

                    {pastInvoices.length === 0 ? (
                        <NoInvoices>No past invoices found.</NoInvoices>
                    ) : (
                        pastInvoices.map(invoice => (
                            <InvoiceCard key={invoice.id} $past>
                                <Text><strong>{invoice.title}</strong></Text>
                                <Text>Date: {dayjs(invoice.date_completed).format("MMM D, YYYY")}</Text>
                                <Text>Amount: ${invoice.compensation}</Text>
                            </InvoiceCard>
                        ))
                    )}
                </>
            )}
        </InvoicesContainer>
    );
};

const InvoicesContainer = styled.div`
    margin-top: 20px;
    text-align: left;
`;

const TabContainer = styled.div`
    display: flex;
    border-bottom: 2px solid white;
    margin-bottom: 10px;
`;

const TabButton = styled.button`
    flex: 1;
    background: ${({ $active }) => ($active ? "#007bff" : "transparent")};
    color: white;
    padding: 10px;
    border: none;
    border-bottom: ${({ $active }) => ($active ? "3px solid #ffcc00" : "none")};
    cursor: pointer;
    transition: background 0.3s;
    font-weight: bold;

    &:hover {
        background: #0056b3;
    }
`;

const InvoiceCard = styled.div`
    background: ${({ $past }) => ($past ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 255, 255, 0.15)")};
    padding: 10px;
    border-radius: 8px;
    margin-top: 10px;
`;


const NoInvoices = styled.p`
    color: white;
`;

const Text = styled.p`
    color: #4B0082;
    margin: 5px 0;
`;

const MarkPaidButton = styled.button`
    background: #28a745;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 10px;
    font-weight: bold;
`;

const InvoiceLimitSelector = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 10px;
`;

const Label = styled.span`
    color: white;
    margin-right: 8px;
`;

const Select = styled.select`
    padding: 6px;
    border-radius: 6px;
    border: none;
`;

export default PetInvoices;