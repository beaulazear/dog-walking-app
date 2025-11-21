import React, { useState, useContext } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import CopyableInvoicesModal from "./CopyableInvoiceModal";
import { DollarSign, Calendar, Trash2, CreditCard, Receipt, Eye, Plus, X, Save, Pencil, Minus } from "lucide-react";
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from './ConfirmModal';

const PetInvoices = ({ pet }) => {
    const { user, setUser } = useContext(UserContext);
    const { confirmState, confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState("unpaid");
    const [invoiceLimit, setInvoiceLimit] = useState(15);
    const [showModal, setShowModal] = useState(false);
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
    const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

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
        const confirmed = await confirm({
            title: 'Mark All as Paid?',
            message: `Mark all ${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? 's' : ''} for this pet as paid?`,
            confirmText: 'Mark Paid',
            cancelText: 'Cancel',
            variant: 'primary'
        });

        if (!confirmed) return;

        setIsMarkingAsPaid(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/invoices/paid`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
                toast.success("All invoices marked as paid!");
            } else {
                toast.error("Failed to mark invoices as paid.");
            }
        } finally {
            setIsMarkingAsPaid(false);
        }
    };

    const deleteInvoice = async (invoiceId) => {
        const confirmed = await confirm({
            title: 'Delete Invoice?',
            message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (!confirmed) return;

        setDeletingInvoiceId(invoiceId);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/invoices/${invoiceId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                setUser(prevUser => ({
                    ...prevUser,
                    invoices: prevUser.invoices.filter(inv => inv.id !== invoiceId)
                }));
                toast.success("Invoice deleted successfully.");
            } else {
                toast.error("Failed to delete invoice. Please try again.");
            }
        } finally {
            setDeletingInvoiceId(null);
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
                                            <InvoiceActions>
                                                {!invoice.is_shared && (
                                                    <EditButton
                                                        onClick={() => setEditingInvoice(invoice)}
                                                        title="Edit invoice"
                                                    >
                                                        <Pencil size={16} />
                                                    </EditButton>
                                                )}
                                                <DeleteButton
                                                    onClick={() => deleteInvoice(invoice.id)}
                                                    disabled={deletingInvoiceId === invoice.id}
                                                    title="Delete invoice"
                                                >
                                                    <Trash2 size={16} />
                                                </DeleteButton>
                                            </InvoiceActions>
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
                                    <PrimaryButton onClick={markAllAsPaid} disabled={isMarkingAsPaid}>
                                        <CreditCard size={16} />
                                        {isMarkingAsPaid ? 'Marking...' : 'Mark All Paid'}
                                    </PrimaryButton>
                                    <SecondaryButton onClick={() => setShowModal(true)} disabled={isMarkingAsPaid}>
                                        <Eye size={16} />
                                        View Copyable
                                    </SecondaryButton>
                                    <CreateInvoiceButton onClick={() => setShowCreateInvoiceModal(true)} disabled={isMarkingAsPaid}>
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
                            invoices: [...prevUser.invoices, newInvoice.invoice]
                        }));
                        setShowCreateInvoiceModal(false);
                    }}
                />
            )}

            {editingInvoice && (
                <EditInvoiceModal
                    pet={pet}
                    user={user}
                    invoice={editingInvoice}
                    onClose={() => setEditingInvoice(null)}
                    onInvoiceUpdated={(updatedInvoiceData) => {
                        setUser(prevUser => ({
                            ...prevUser,
                            invoices: prevUser.invoices.map(inv =>
                                inv.id === updatedInvoiceData.invoice.id ? updatedInvoiceData.invoice : inv
                            )
                        }));
                        setEditingInvoice(null);
                    }}
                />
            )}

            {confirmState.isOpen && (
                <ConfirmModal
                    title={confirmState.title}
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onCancel={confirmState.onCancel}
                    confirmText={confirmState.confirmText}
                    cancelText={confirmState.cancelText}
                    variant={confirmState.variant}
                />
            )}
        </InvoicesContainer>
    );
};

// Create Invoice Modal Component
const CreateInvoiceModal = ({ pet, user, onClose, onInvoiceCreated }) => {
    const [formData, setFormData] = useState({
        appointment_id: '',
        date_completed: dayjs().format('YYYY-MM-DD')
    });
    const [duration, setDuration] = useState(30);
    const [walkType, setWalkType] = useState('group');
    const [offset, setOffset] = useState(0);
    const [offsetType, setOffsetType] = useState('upcharge');
    const [isCreating, setIsCreating] = useState(false);

    // Get appointments for this pet that could be associated with an invoice
    const availableAppointments = user.appointments?.filter(apt =>
        apt.pet_id === pet.id && !apt.canceled
    ) || [];

    // Auto-calculate compensation based on duration, walk type, and offset
    const baseCompensation = duration === 30 ? (user.thirty || 0)
        : duration === 45 ? (user.fortyfive || 0)
        : duration === 60 ? (user.sixty || 0)
        : 0;

    const walkTypeUpcharge = walkType === 'solo' ? (user.solo_rate || 0)
        : walkType === 'training' ? (user.training_rate || 0)
        : walkType === 'sibling' ? (user.sibling_rate || 0)
        : 0;

    const totalCompensation = baseCompensation + walkTypeUpcharge + (offsetType === 'upcharge' ? offset : -offset);

    const title = `${duration} min ${walkType} walk`;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.appointment_id) {
            toast.error('Please select an appointment');
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice: {
                        appointment_id: parseInt(formData.appointment_id),
                        pet_id: pet.id,
                        title: title,
                        compensation: totalCompensation,
                        date_completed: dayjs(formData.date_completed).toISOString(),
                        paid: false
                    }
                })
            });

            if (response.ok) {
                const newInvoice = await response.json();
                onInvoiceCreated(newInvoice);
                toast.success('Manual invoice created successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.errors?.join(', ') || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Failed to create invoice. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isCreating) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isCreating) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isCreating]);

    const modalContent = (
        <CreateModalOverlay onClick={handleOverlayClick}>
            <CreateModalContainer>
                <CreateModalDragHandle />

                <CreateModalHeader>
                    <CreateModalHeaderTop>
                        <CreateModalTitle>Create Invoice</CreateModalTitle>
                        <CreateModalCloseButton onClick={onClose} disabled={isCreating}>
                            <X size={20} />
                        </CreateModalCloseButton>
                    </CreateModalHeaderTop>
                    <CreateModalSubtitle>
                        Creating invoice for {pet.name}
                    </CreateModalSubtitle>
                </CreateModalHeader>

                <CreateModalContent>
                    <CreateForm onSubmit={handleSubmit}>
                        <FormSection>
                            <FormLabel>Appointment *</FormLabel>
                            <FormSelect
                                value={formData.appointment_id}
                                onChange={(e) => setFormData({...formData, appointment_id: e.target.value})}
                                required
                                disabled={isCreating}
                            >
                                <option value="">Select appointment...</option>
                                {availableAppointments.map(apt => (
                                    <option key={apt.id} value={apt.id}>
                                        {apt.recurring ? 'Recurring' : dayjs(apt.appointment_date).format('MMM D, YYYY')} -
                                        {apt.duration} min walk
                                    </option>
                                ))}
                            </FormSelect>
                            <FormHint>
                                Invoices must be linked to an existing appointment
                            </FormHint>
                        </FormSection>

                        <FormSection>
                            <FormLabel>Service Date *</FormLabel>
                            <FormInput
                                type="date"
                                value={formData.date_completed}
                                onChange={(e) => setFormData({...formData, date_completed: e.target.value})}
                                required
                                disabled={isCreating}
                            />
                        </FormSection>

                        <FormSection>
                            <FormLabel>Walk Duration *</FormLabel>
                            <DurationSelector>
                                <DurationOption
                                    type="button"
                                    $active={duration === 30}
                                    onClick={() => setDuration(30)}
                                    disabled={isCreating}
                                >
                                    <DurationTime>30</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                                <DurationOption
                                    type="button"
                                    $active={duration === 45}
                                    onClick={() => setDuration(45)}
                                    disabled={isCreating}
                                >
                                    <DurationTime>45</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                                <DurationOption
                                    type="button"
                                    $active={duration === 60}
                                    onClick={() => setDuration(60)}
                                    disabled={isCreating}
                                >
                                    <DurationTime>60</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                            </DurationSelector>
                        </FormSection>

                        <FormSection>
                            <FormLabel>Walk Type *</FormLabel>
                            <WalkTypeSelector>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'group'}
                                    onClick={() => setWalkType('group')}
                                    disabled={isCreating}
                                >
                                    Group
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'solo'}
                                    onClick={() => setWalkType('solo')}
                                    disabled={isCreating}
                                >
                                    Solo
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'training'}
                                    onClick={() => setWalkType('training')}
                                    disabled={isCreating}
                                >
                                    Training
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'sibling'}
                                    onClick={() => setWalkType('sibling')}
                                    disabled={isCreating}
                                >
                                    Sibling
                                </WalkTypeOption>
                            </WalkTypeSelector>
                        </FormSection>

                        <CompensationBreakdownSection>
                            <FormLabel>Price Breakdown</FormLabel>
                            <CompensationCard>
                                <CompensationRow>
                                    <span>Base Rate ({duration} min)</span>
                                    <span>${baseCompensation.toFixed(2)}</span>
                                </CompensationRow>
                                {walkTypeUpcharge > 0 && (
                                    <CompensationRow>
                                        <span>{walkType.charAt(0).toUpperCase() + walkType.slice(1)} Upcharge</span>
                                        <span>+${walkTypeUpcharge.toFixed(2)}</span>
                                    </CompensationRow>
                                )}
                                {offset > 0 && (
                                    <CompensationRow>
                                        <span>{offsetType === 'upcharge' ? 'Additional' : 'Discount'}</span>
                                        <span>{offsetType === 'upcharge' ? '+' : '-'}${offset.toFixed(2)}</span>
                                    </CompensationRow>
                                )}
                                <CompensationTotal>
                                    <strong>Total</strong>
                                    <strong>${totalCompensation.toFixed(2)}</strong>
                                </CompensationTotal>
                            </CompensationCard>
                        </CompensationBreakdownSection>

                        <FormSection>
                            <FormLabel>Adjustment (Optional)</FormLabel>
                            <AdjustmentTypeToggle>
                                <AdjustmentTypeButton
                                    type="button"
                                    $active={offsetType === 'upcharge'}
                                    onClick={() => setOffsetType('upcharge')}
                                    disabled={isCreating}
                                >
                                    <Plus size={16} />
                                    Add
                                </AdjustmentTypeButton>
                                <AdjustmentTypeButton
                                    type="button"
                                    $active={offsetType === 'discount'}
                                    onClick={() => setOffsetType('discount')}
                                    disabled={isCreating}
                                >
                                    <Minus size={16} />
                                    Subtract
                                </AdjustmentTypeButton>
                            </AdjustmentTypeToggle>
                            <AdjustmentInputContainer>
                                <DollarSign size={18} />
                                <FormInput
                                    type="number"
                                    value={offset}
                                    onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={isCreating}
                                />
                            </AdjustmentInputContainer>
                        </FormSection>

                        <FormActions>
                            <FormSubmitButton type="submit" disabled={isCreating}>
                                {isCreating ? (
                                    <>Creating...</>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Create Invoice
                                    </>
                                )}
                            </FormSubmitButton>
                            <CancelFormButton type="button" onClick={onClose} disabled={isCreating}>
                                Cancel
                            </CancelFormButton>
                        </FormActions>
                    </CreateForm>
                </CreateModalContent>
            </CreateModalContainer>
        </CreateModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Edit Invoice Modal Component
const EditInvoiceModal = ({ pet, user, invoice, onClose, onInvoiceUpdated }) => {
    // Parse existing invoice data to extract duration and walk type
    const parseDurationFromTitle = (title) => {
        const match = title?.match(/(\d+)\s*min/);
        return match ? parseInt(match[1]) : 30;
    };

    const parseWalkTypeFromTitle = (title) => {
        const titleLower = title?.toLowerCase() || '';
        if (titleLower.includes('solo')) return 'solo';
        if (titleLower.includes('training')) return 'training';
        if (titleLower.includes('sibling')) return 'sibling';
        return 'group';
    };

    const [formData, setFormData] = useState({
        appointment_id: invoice.appointment_id || '',
        date_completed: dayjs(invoice.date_completed).format('YYYY-MM-DD')
    });
    const [duration, setDuration] = useState(parseDurationFromTitle(invoice.title));
    const [walkType, setWalkType] = useState(parseWalkTypeFromTitle(invoice.title));
    const [offset, setOffset] = useState(0);
    const [offsetType, setOffsetType] = useState('upcharge');
    const [isUpdating, setIsUpdating] = useState(false);

    // Get appointments for this pet that could be associated with an invoice
    const availableAppointments = user.appointments?.filter(apt =>
        apt.pet_id === pet.id && !apt.canceled
    ) || [];

    // Auto-calculate compensation based on duration, walk type, and offset
    const baseCompensation = duration === 30 ? (user.thirty || 0)
        : duration === 45 ? (user.fortyfive || 0)
        : duration === 60 ? (user.sixty || 0)
        : 0;

    const walkTypeUpcharge = walkType === 'solo' ? (user.solo_rate || 0)
        : walkType === 'training' ? (user.training_rate || 0)
        : walkType === 'sibling' ? (user.sibling_rate || 0)
        : 0;

    const totalCompensation = baseCompensation + walkTypeUpcharge + (offsetType === 'upcharge' ? offset : -offset);

    const title = `${duration} min ${walkType} walk`;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.appointment_id) {
            toast.error('Please select an appointment');
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch(`/invoices/${invoice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice: {
                        appointment_id: parseInt(formData.appointment_id),
                        title: title,
                        compensation: totalCompensation,
                        date_completed: dayjs(formData.date_completed).toISOString()
                    }
                })
            });

            if (response.ok) {
                const updatedInvoice = await response.json();
                onInvoiceUpdated(updatedInvoice);
                toast.success('Invoice updated successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || errorData.errors?.join(', ') || 'Failed to update invoice');
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isUpdating) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isUpdating) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isUpdating]);

    const modalContent = (
        <CreateModalOverlay onClick={handleOverlayClick}>
            <CreateModalContainer>
                <CreateModalDragHandle />

                <CreateModalHeader>
                    <CreateModalHeaderTop>
                        <CreateModalTitle>Edit Invoice</CreateModalTitle>
                        <CreateModalCloseButton onClick={onClose} disabled={isUpdating}>
                            <X size={20} />
                        </CreateModalCloseButton>
                    </CreateModalHeaderTop>
                    <CreateModalSubtitle>
                        Editing invoice for {pet.name}
                    </CreateModalSubtitle>
                </CreateModalHeader>

                <CreateModalContent>
                    <CreateForm onSubmit={handleSubmit}>
                        <FormSection>
                            <FormLabel>Appointment *</FormLabel>
                            <FormSelect
                                value={formData.appointment_id}
                                onChange={(e) => setFormData({...formData, appointment_id: e.target.value})}
                                required
                                disabled={isUpdating}
                            >
                                <option value="">Select appointment...</option>
                                {availableAppointments.map(apt => (
                                    <option key={apt.id} value={apt.id}>
                                        {apt.recurring ? 'Recurring' : dayjs(apt.appointment_date).format('MMM D, YYYY')} -
                                        {apt.duration} min walk
                                    </option>
                                ))}
                            </FormSelect>
                            <FormHint>
                                Invoices must be linked to an existing appointment
                            </FormHint>
                        </FormSection>

                        <FormSection>
                            <FormLabel>Service Date *</FormLabel>
                            <FormInput
                                type="date"
                                value={formData.date_completed}
                                onChange={(e) => setFormData({...formData, date_completed: e.target.value})}
                                required
                                disabled={isUpdating}
                            />
                        </FormSection>

                        <FormSection>
                            <FormLabel>Walk Duration *</FormLabel>
                            <DurationSelector>
                                <DurationOption
                                    type="button"
                                    $active={duration === 30}
                                    onClick={() => setDuration(30)}
                                    disabled={isUpdating}
                                >
                                    <DurationTime>30</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                                <DurationOption
                                    type="button"
                                    $active={duration === 45}
                                    onClick={() => setDuration(45)}
                                    disabled={isUpdating}
                                >
                                    <DurationTime>45</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                                <DurationOption
                                    type="button"
                                    $active={duration === 60}
                                    onClick={() => setDuration(60)}
                                    disabled={isUpdating}
                                >
                                    <DurationTime>60</DurationTime>
                                    <DurationUnit>min</DurationUnit>
                                </DurationOption>
                            </DurationSelector>
                        </FormSection>

                        <FormSection>
                            <FormLabel>Walk Type *</FormLabel>
                            <WalkTypeSelector>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'group'}
                                    onClick={() => setWalkType('group')}
                                    disabled={isUpdating}
                                >
                                    Group
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'solo'}
                                    onClick={() => setWalkType('solo')}
                                    disabled={isUpdating}
                                >
                                    Solo
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'training'}
                                    onClick={() => setWalkType('training')}
                                    disabled={isUpdating}
                                >
                                    Training
                                </WalkTypeOption>
                                <WalkTypeOption
                                    type="button"
                                    $active={walkType === 'sibling'}
                                    onClick={() => setWalkType('sibling')}
                                    disabled={isUpdating}
                                >
                                    Sibling
                                </WalkTypeOption>
                            </WalkTypeSelector>
                        </FormSection>

                        <CompensationBreakdownSection>
                            <FormLabel>Price Breakdown</FormLabel>
                            <CompensationCard>
                                <CompensationRow>
                                    <span>Base Rate ({duration} min)</span>
                                    <span>${baseCompensation.toFixed(2)}</span>
                                </CompensationRow>
                                {walkTypeUpcharge > 0 && (
                                    <CompensationRow>
                                        <span>{walkType.charAt(0).toUpperCase() + walkType.slice(1)} Upcharge</span>
                                        <span>+${walkTypeUpcharge.toFixed(2)}</span>
                                    </CompensationRow>
                                )}
                                {offset > 0 && (
                                    <CompensationRow>
                                        <span>{offsetType === 'upcharge' ? 'Additional' : 'Discount'}</span>
                                        <span>{offsetType === 'upcharge' ? '+' : '-'}${offset.toFixed(2)}</span>
                                    </CompensationRow>
                                )}
                                <CompensationTotal>
                                    <strong>Total</strong>
                                    <strong>${totalCompensation.toFixed(2)}</strong>
                                </CompensationTotal>
                            </CompensationCard>
                        </CompensationBreakdownSection>

                        <FormSection>
                            <FormLabel>Adjustment (Optional)</FormLabel>
                            <AdjustmentTypeToggle>
                                <AdjustmentTypeButton
                                    type="button"
                                    $active={offsetType === 'upcharge'}
                                    onClick={() => setOffsetType('upcharge')}
                                    disabled={isUpdating}
                                >
                                    <Plus size={16} />
                                    Add
                                </AdjustmentTypeButton>
                                <AdjustmentTypeButton
                                    type="button"
                                    $active={offsetType === 'discount'}
                                    onClick={() => setOffsetType('discount')}
                                    disabled={isUpdating}
                                >
                                    <Minus size={16} />
                                    Subtract
                                </AdjustmentTypeButton>
                            </AdjustmentTypeToggle>
                            <AdjustmentInputContainer>
                                <DollarSign size={18} />
                                <FormInput
                                    type="number"
                                    value={offset}
                                    onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={isUpdating}
                                />
                            </AdjustmentInputContainer>
                        </FormSection>

                        <FormActions>
                            <FormSubmitButton type="submit" disabled={isUpdating}>
                                {isUpdating ? (
                                    <>Updating...</>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Update Invoice
                                    </>
                                )}
                            </FormSubmitButton>
                            <CancelFormButton type="button" onClick={onClose} disabled={isUpdating}>
                                Cancel
                            </CancelFormButton>
                        </FormActions>
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

const InvoiceActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const EditButton = styled.button`
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
    border: 2px solid rgba(59, 130, 246, 0.3);
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.5);
        transform: scale(1.05);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
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

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: scale(1.05);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #7d527e, #936394);
        border-color: rgba(165, 105, 167, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(139, 90, 140, 0.4);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    backdrop-filter: blur(12px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 10003;
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @media (min-width: 768px) {
        align-items: center;
        padding: 20px;
    }
`;

const CreateModalContainer = styled.div`
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    width: 100%;
    max-width: 500px;
    max-height: 95vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    @keyframes slideUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @media (max-width: 767px) {
        border-radius: 24px 24px 0 0;
    }

    @media (min-width: 768px) {
        border-radius: 24px;
        animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);

        @keyframes scaleIn {
            from {
                transform: scale(0.9);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }
`;

const CreateModalDragHandle = styled.div`
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;

    @media (min-width: 768px) {
        display: none;
    }
`;

const CreateModalHeader = styled.div`
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CreateModalHeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const CreateModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;

    @media (max-width: 767px) {
        font-size: 1.1rem;
    }
`;

const CreateModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CreateModalSubtitle = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-weight: 500;

    @media (max-width: 767px) {
        font-size: 0.85rem;
    }
`;

const CreateModalContent = styled.div`
    padding: 24px 20px 28px;

    @media (max-width: 767px) {
        padding: 20px 16px 24px;
    }
`;

const CreateForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 18px;
`;

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FormLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const FormInput = styled.input`
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 14px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #ffffff;
    transition: all 0.2s ease;

    &::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
        outline: none;
        border-color: rgba(165, 105, 167, 0.5);
        background: rgba(255, 255, 255, 0.12);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const FormSelect = styled.select`
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 14px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #ffffff;
    transition: all 0.2s ease;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: rgba(165, 105, 167, 0.5);
        background: rgba(255, 255, 255, 0.12);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    option {
        background: #2D1B2E;
        color: #ffffff;
        padding: 10px;
    }
`;

const FormHint = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    line-height: 1.3;

    @media (max-width: 767px) {
        font-size: 0.75rem;
    }
`;

const FormActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
`;

const FormSubmitButton = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 16px;
    padding: 18px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
    letter-spacing: -0.01em;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(34, 197, 94, 0.4);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 16px 20px;
        font-size: 1rem;
    }
`;

const CancelFormButton = styled.button`
    background: transparent;
    border: none;
    border-radius: 16px;
    padding: 14px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 12px 20px;
        font-size: 0.9rem;
    }
`;

// Duration Selector Styles
const DurationSelector = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
`;

const DurationOption = styled.button`
    background: ${({ $active }) =>
        $active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'rgba(255, 255, 255, 0.1)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? 'rgba(165, 105, 167, 0.5)' : 'rgba(255, 255, 255, 0.2)'
    };
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover:not(:disabled) {
        background: ${({ $active }) =>
            $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'rgba(255, 255, 255, 0.15)'
        };
        transform: translateY(-2px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const DurationTime = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
`;

const DurationUnit = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

// Walk Type Selector Styles
const WalkTypeSelector = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 8px;
`;

const WalkTypeOption = styled.button`
    background: ${({ $active }) =>
        $active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'rgba(255, 255, 255, 0.1)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? 'rgba(165, 105, 167, 0.5)' : 'rgba(255, 255, 255, 0.2)'
    };
    border-radius: 10px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #ffffff;

    &:hover:not(:disabled) {
        background: ${({ $active }) =>
            $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'rgba(255, 255, 255, 0.15)'
        };
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// Compensation Breakdown Styles
const CompensationBreakdownSection = styled.div`
    margin: 16px 0;
`;

const CompensationCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 8px;
    backdrop-filter: blur(10px);
`;

const CompensationRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);

    &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    span:last-child {
        font-weight: 600;
        color: #ffffff;
    }
`;

const CompensationTotal = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 4px 0;
    margin-top: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    color: #ffffff;

    strong {
        font-weight: 700;
    }

    strong:last-child {
        color: #86efac;
        font-size: 1.3rem;
    }
`;

// Adjustment Section Styles
const AdjustmentTypeToggle = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 8px 0 12px 0;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px;
    border-radius: 10px;
`;

const AdjustmentTypeButton = styled.button`
    background: ${({ $active }) =>
        $active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'transparent'
    };
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover:not(:disabled) {
        background: ${({ $active }) =>
            $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'rgba(255, 255, 255, 0.1)'
        };
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const AdjustmentInputContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 12px 14px;
    transition: all 0.3s ease;

    &:focus-within {
        border-color: rgba(165, 105, 167, 0.5);
        background: rgba(255, 255, 255, 0.12);
    }

    svg {
        color: rgba(255, 255, 255, 0.6);
    }

    input {
        background: none;
        border: none;
        outline: none;
        flex: 1;
    }
`;