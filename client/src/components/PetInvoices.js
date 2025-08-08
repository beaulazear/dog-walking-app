import React, { useState, useContext } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import CopyableInvoicesModal from "./CopyableInvoiceModal";
import { DollarSign, Calendar, Trash2, CreditCard, Receipt, Eye, Plus, X, Save } from "lucide-react";

const PetInvoices = ({ pet }) => {
    const { user, setUser } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState("unpaid");
    const [invoiceLimit, setInvoiceLimit] = useState(15);
    const [showModal, setShowModal] = useState(false);
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

    const petInvoices = user.invoices.filter(invoice => invoice.pet_id === pet.id);

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

    const deleteInvoice = async (invoiceId) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;

        const response = await fetch(`/invoices/${invoiceId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            setUser(prevUser => ({
                ...prevUser,
                invoices: prevUser.invoices.filter(inv => inv.id !== invoiceId)
            }));
        } else {
            alert("Failed to delete invoice. Please try again.");
        }
    };

    const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.compensation, 0);

    return (
        <InvoicesContainer>
            <TabContainer>
                <TabButton $active={activeTab === "unpaid"} onClick={() => setActiveTab("unpaid")}>
                    <CreditCard size={16} />
                    Unpaid ({unpaidInvoices.length})
                </TabButton>

                <TabButton $active={activeTab === "paid"} onClick={() => setActiveTab("paid")}>
                    <Receipt size={16} />
                    Paid History
                </TabButton>
            </TabContainer>

            {activeTab === "unpaid" ? (
                <UnpaidSection>
                    {unpaidInvoices.length === 0 ? (
                        <EmptyState>
                            <EmptyIcon>
                                <CreditCard size={48} />
                            </EmptyIcon>
                            <EmptyTitle>No unpaid invoices</EmptyTitle>
                            <EmptyText>All invoices for this pet are paid up!</EmptyText>
                            <CreateInvoiceButton onClick={() => setShowCreateInvoiceModal(true)}>
                                <Plus size={16} />
                                Create Manual Invoice
                            </CreateInvoiceButton>
                        </EmptyState>
                    ) : (
                        <>
                            <InvoicesList>
                                {unpaidInvoices.map(invoice => (
                                    <InvoiceCard key={invoice.id} $unpaid>
                                        <InvoiceHeader>
                                            <InvoiceTitle>{invoice.title}</InvoiceTitle>
                                            <InvoiceAmount>${invoice.compensation}</InvoiceAmount>
                                        </InvoiceHeader>
                                        <InvoiceDetails>
                                            <InvoiceDate>
                                                <Calendar size={14} />
                                                {dayjs(invoice.date_completed).format("MMM D, YYYY")}
                                            </InvoiceDate>
                                            <DeleteButton onClick={() => deleteInvoice(invoice.id)}>
                                                <Trash2 size={16} />
                                            </DeleteButton>
                                        </InvoiceDetails>
                                    </InvoiceCard>
                                ))}
                            </InvoicesList>
                            
                            <SummarySection>
                                <TotalAmount>
                                    <DollarSign size={20} />
                                    Total: ${totalUnpaid.toFixed(2)}
                                </TotalAmount>
                                
                                <ActionButtons>
                                    <PrimaryButton onClick={markAllAsPaid}>
                                        <CreditCard size={16} />
                                        Mark All Paid
                                    </PrimaryButton>
                                    <SecondaryButton onClick={() => setShowModal(true)}>
                                        <Eye size={16} />
                                        View Copyable
                                    </SecondaryButton>
                                    <CreateInvoiceButton onClick={() => setShowCreateInvoiceModal(true)}>
                                        <Plus size={16} />
                                        Create Invoice
                                    </CreateInvoiceButton>
                                </ActionButtons>
                            </SummarySection>
                            
                            {showModal && (
                                <CopyableInvoicesModal 
                                    total={totalUnpaid} 
                                    unpaidInvoices={unpaidInvoices} 
                                    onClose={() => setShowModal(false)} 
                                />
                            )}
                        </>
                    )}
                </UnpaidSection>
            ) : (
                <PaidSection>
                    <LimitSelector>
                        <LimitLabel>Show:</LimitLabel>
                        <LimitSelect value={invoiceLimit} onChange={(e) => setInvoiceLimit(e.target.value)}>
                            <option value={15}>Last 15</option>
                            <option value={50}>Last 50</option>
                            <option value="all">All History</option>
                        </LimitSelect>
                    </LimitSelector>

                    {pastInvoices.length === 0 ? (
                        <EmptyState>
                            <EmptyIcon>
                                <Receipt size={48} />
                            </EmptyIcon>
                            <EmptyTitle>No paid invoices</EmptyTitle>
                            <EmptyText>Paid invoices will appear here</EmptyText>
                        </EmptyState>
                    ) : (
                        <InvoicesList>
                            {pastInvoices.map(invoice => (
                                <InvoiceCard key={invoice.id} $paid>
                                    <InvoiceHeader>
                                        <InvoiceTitle>{invoice.title}</InvoiceTitle>
                                        <InvoiceAmount>${invoice.compensation}</InvoiceAmount>
                                    </InvoiceHeader>
                                    <InvoiceDetails>
                                        <InvoiceDate>
                                            <Calendar size={14} />
                                            {dayjs(invoice.date_completed).format("MMM D, YYYY")}
                                        </InvoiceDate>
                                        <PaidBadge>Paid</PaidBadge>
                                    </InvoiceDetails>
                                </InvoiceCard>
                            ))}
                        </InvoicesList>
                    )}
                </PaidSection>
            )}
            
            {showCreateInvoiceModal && (
                <CreateInvoiceModal 
                    pet={pet}
                    user={user}
                    onClose={() => setShowCreateInvoiceModal(false)}
                    onInvoiceCreated={(newInvoice) => {
                        setUser(prevUser => ({
                            ...prevUser,
                            invoices: [...prevUser.invoices, newInvoice]
                        }));
                        setShowCreateInvoiceModal(false);
                    }}
                />
            )}
        </InvoicesContainer>
    );
};

// Create Invoice Modal Component
const CreateInvoiceModal = ({ pet, user, onClose, onInvoiceCreated }) => {
    const [formData, setFormData] = useState({
        appointment_id: '',
        title: '',
        compensation: '',
        date_completed: dayjs().format('YYYY-MM-DD')
    });

    // Get appointments for this pet that could be associated with an invoice
    const availableAppointments = user.appointments?.filter(apt => 
        apt.pet_id === pet.id && !apt.canceled
    ) || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.appointment_id || !formData.title || !formData.compensation) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice: {
                        appointment_id: parseInt(formData.appointment_id),
                        pet_id: pet.id,
                        title: formData.title,
                        compensation: parseFloat(formData.compensation),
                        date_completed: dayjs(formData.date_completed).toISOString(),
                        paid: false
                    }
                })
            });

            if (response.ok) {
                const newInvoice = await response.json();
                onInvoiceCreated(newInvoice);
                alert('Manual invoice created successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.errors?.join(', ') || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice. Please try again.');
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const modalContent = (
        <CreateModalOverlay onClick={handleOverlayClick}>
            <CreateModalContainer>
                <CreateModalHeader>
                    <CreateModalTitle>
                        <Plus size={24} />
                        Create Manual Invoice
                    </CreateModalTitle>
                    <CreateModalCloseButton onClick={onClose}>
                        <X size={18} />
                    </CreateModalCloseButton>
                </CreateModalHeader>
                
                <CreateModalContent>
                    <CreateModalSubtitle>
                        Creating invoice for {pet.name}
                    </CreateModalSubtitle>
                    
                    <CreateForm onSubmit={handleSubmit}>
                        <CreateFormGroup>
                            <CreateFormLabel>Associated Appointment *</CreateFormLabel>
                            <CreateFormSelect
                                value={formData.appointment_id}
                                onChange={(e) => setFormData({...formData, appointment_id: e.target.value})}
                                required
                            >
                                <option value="">Select an appointment...</option>
                                {availableAppointments.map(apt => (
                                    <option key={apt.id} value={apt.id}>
                                        {apt.recurring ? 'Recurring' : dayjs(apt.appointment_date).format('MMM D, YYYY')} - 
                                        {apt.duration} min walk
                                    </option>
                                ))}
                            </CreateFormSelect>
                            <CreateFormHint>
                                Required: Invoices must be associated with an existing appointment
                            </CreateFormHint>
                        </CreateFormGroup>

                        <CreateFormGroup>
                            <CreateFormLabel>Service Description *</CreateFormLabel>
                            <CreateFormInput
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g., 30 min walk, Pet sitting, etc."
                                required
                            />
                        </CreateFormGroup>

                        <CreateFormGroup>
                            <CreateFormLabel>Amount *</CreateFormLabel>
                            <AmountInputWrapper>
                                <DollarSign size={16} />
                                <CreateFormInput
                                    type="number"
                                    value={formData.compensation}
                                    onChange={(e) => setFormData({...formData, compensation: e.target.value})}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </AmountInputWrapper>
                        </CreateFormGroup>

                        <CreateFormGroup>
                            <CreateFormLabel>Service Date *</CreateFormLabel>
                            <CreateFormInput
                                type="date"
                                value={formData.date_completed}
                                onChange={(e) => setFormData({...formData, date_completed: e.target.value})}
                                required
                            />
                        </CreateFormGroup>

                        <CreateModalButtonGroup>
                            <CreateSubmitButton type="submit">
                                <Save size={16} />
                                Create Invoice
                            </CreateSubmitButton>
                            <CreateCancelButton type="button" onClick={onClose}>
                                <X size={16} />
                                Cancel
                            </CreateCancelButton>
                        </CreateModalButtonGroup>
                    </CreateForm>
                </CreateModalContent>
            </CreateModalContainer>
        </CreateModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default PetInvoices;

const InvoicesContainer = styled.div`
    margin-top: 24px;
`;

const TabContainer = styled.div`
    display: flex;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
`;

const TabButton = styled.button`
    flex: 1;
    background: ${({ $active }) => ($active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'transparent')};
    color: #ffffff;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-shadow: ${({ $active }) => ($active ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none')};

    &:hover {
        background: ${({ $active }) => ($active ? 'linear-gradient(135deg, #7d527e, #936394)' : 'rgba(255, 255, 255, 0.1)')};
        transform: translateY(-1px);
    }
    
    @media (max-width: 768px) {
        font-size: 0.8rem;
        padding: 12px;
    }
`;

const UnpaidSection = styled.div``;

const PaidSection = styled.div``;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    
    @media (max-width: 768px) {
        padding: 32px 16px;
    }
`;

const EmptyIcon = styled.div`
    margin-bottom: 16px;
    opacity: 0.6;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
`;

const EmptyTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.1rem;
    margin-bottom: 8px;
    font-weight: 600;
`;

const EmptyText = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    margin: 0;
`;

const InvoicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const InvoiceCard = styled.div`
    background: ${({ $unpaid, $paid }) => 
        $unpaid ? 'linear-gradient(145deg, rgba(255, 99, 132, 0.1), rgba(255, 159, 64, 0.05))' : 
        $paid ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))' : 
        'rgba(255, 255, 255, 0.1)'
    };
    padding: 16px 18px;
    border-radius: 12px;
    border: 2px solid ${({ $unpaid, $paid }) => 
        $unpaid ? 'rgba(255, 99, 132, 0.2)' : 
        $paid ? 'rgba(34, 197, 94, 0.2)' : 
        'rgba(255, 255, 255, 0.1)'
    };
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border-color: ${({ $unpaid, $paid }) => 
            $unpaid ? 'rgba(255, 99, 132, 0.3)' : 
            $paid ? 'rgba(34, 197, 94, 0.3)' : 
            'rgba(255, 255, 255, 0.2)'
        };
    }
    
    @media (max-width: 768px) {
        padding: 14px 16px;
    }
`;

const InvoiceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
    }
`;

const InvoiceTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.95rem;
    }
`;

const InvoiceAmount = styled.span`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const InvoiceDetails = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const InvoiceDate = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
`;

const DeleteButton = styled.button`
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 2px solid rgba(239, 68, 68, 0.3);
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: scale(1.05);
    }
`;

const PaidBadge = styled.span`
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
    padding: 4px 10px;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(34, 197, 94, 0.3);
`;

const SummarySection = styled.div`
    margin-top: 20px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
`;

const TotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
    
    @media (max-width: 980px) {
        flex-wrap: wrap;
        
        > button {
            flex: 1;
            min-width: 140px;
        }
    }
`;

const PrimaryButton = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }
    
    @media (max-width: 768px) {
        justify-content: center;
        padding: 14px;
    }
`;

const SecondaryButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 12px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(5px);
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
        justify-content: center;
        padding: 14px;
    }
`;

const LimitSelector = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 10px;
`;

const LimitLabel = styled.span`
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
`;

const LimitSelect = styled.select`
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
    }
    
    option {
        background: #4a1a4a;
        color: #ffffff;
    }
`;

const CreateInvoiceButton = styled.button`
    background: linear-gradient(135deg, #8b5a8c, #a569a7);
    color: #ffffff;
    padding: 12px 20px;
    border: 2px solid rgba(165, 105, 167, 0.4);
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(139, 90, 140, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #7d527e, #936394);
        border-color: rgba(165, 105, 167, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(139, 90, 140, 0.4);
    }
    
    @media (max-width: 768px) {
        justify-content: center;
        padding: 14px;
    }
`;

// Create Invoice Modal Styled Components
const CreateModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10003;
    padding: 20px;
`;

const CreateModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 24px;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
`;

const CreateModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 20px;
`;

const CreateModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CreateModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.1);
    }
`;

const CreateModalContent = styled.div`
    padding: 0 24px 24px;
`;

const CreateModalSubtitle = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 24px 0;
    font-weight: 500;
`;

const CreateForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const CreateFormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const CreateFormLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const CreateFormInput = styled.input`
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ffffff;
    transition: all 0.3s ease;
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
`;

const CreateFormSelect = styled.select`
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ffffff;
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
    
    option {
        background: #4a1a4a;
        color: #ffffff;
        padding: 8px;
    }
`;

const CreateFormHint = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    font-style: italic;
`;

const AmountInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    
    svg {
        position: absolute;
        left: 16px;
        color: rgba(255, 255, 255, 0.7);
        z-index: 1;
    }
    
    input {
        padding-left: 44px;
    }
`;

const CreateModalButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 8px;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const CreateSubmitButton = styled.button`
    flex: 1;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 14px;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 24px rgba(34, 197, 94, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
    }
`;

const CreateCancelButton = styled.button`
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    padding: 16px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
`;