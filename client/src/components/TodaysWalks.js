import React, { useContext, useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "motion/react";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";
import {
    CheckCircle,
    X,
    Dog,
    DollarSign,
    Plus,
    Minus,
    MapPin,
    Info,
    Cake,
    User,
    Heart,
    Share2,
    Calendar,
    Map,
    Route
} from "lucide-react";
import ShareAppointmentModal from "./ShareAppointmentModal";
import WalksMapView from "./WalksMapView";
import RouteJourneyPanel from "./RouteJourneyPanel";
import { calculateRouteWithTimes } from "../utils/routeCalculations";
import * as S from "./TodaysWalks.styles";

export default function TodaysWalks() {
    const { user, refreshUser, addInvoice } = useContext(UserContext);
    const [showMap, setShowMap] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Helper function to check if recurring appointment occurs on a specific date
    const isRecurringOnDate = useCallback((appointment, date) => {
        const dayOfWeek = dayjs(date).day();
        const recurringDays = {
            0: appointment.sunday,
            1: appointment.monday,
            2: appointment.tuesday,
            3: appointment.wednesday,
            4: appointment.thursday,
            5: appointment.friday,
            6: appointment.saturday
        };
        return recurringDays[dayOfWeek];
    }, []);

    // Get appointments for a specific date (same logic as Dashboard)
    const getAppointmentsForDate = useCallback((date) => {
        return (user?.appointments
            ?.filter(appointment => {
                if (appointment.canceled) return false;

                const formattedDate = dayjs(date).format("YYYY-MM-DD");
                const hasCancellation = appointment.cancellations?.some(cancellation =>
                    dayjs(cancellation.date).format("YYYY-MM-DD") === formattedDate
                );
                if (hasCancellation) return false;

                if (appointment.recurring) {
                    return isRecurringOnDate(appointment, date);
                }
                return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === formattedDate;
            })
            ?.sort((a, b) => {
                const startA = dayjs(a.start_time, "HH:mm");
                const startB = dayjs(b.start_time, "HH:mm");
                const endA = dayjs(a.end_time, "HH:mm");
                const endB = dayjs(b.end_time, "HH:mm");

                if (startA.isBefore(startB)) return -1;
                if (startA.isAfter(startB)) return 1;

                return endA.isBefore(endB) ? -1 : 1;
            }) || []);
    }, [user?.appointments, isRecurringOnDate]);

    const fetchOptimizedRoute = async () => {
        setIsLoadingRoute(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/routes/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: dayjs().format('YYYY-MM-DD'),
                    compare: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                setOptimizedRoute(data);
            } else {
                console.error('Failed to fetch optimized route');
                setOptimizedRoute(null);
            }
        } catch (error) {
            console.error('Error fetching optimized route:', error);
            setOptimizedRoute(null);
        } finally {
            setIsLoadingRoute(false);
        }
    };

    // Get today's appointments using the same logic as Dashboard
    const todaysAppointments = useMemo(() => {
        return getAppointmentsForDate(dayjs());
    }, [getAppointmentsForDate]);

    // Calculate daily earnings from today's invoices
    const dailyEarnings = useMemo(() => {
        const todayString = dayjs().format("YYYY-MM-DD");
        return user?.invoices
            ?.filter(invoice => {
                if (!invoice.date_completed) return false;
                const invoiceDate = invoice.date_completed.slice(0, 10);
                return invoiceDate === todayString && !invoice.cancelled;
            })
            ?.reduce((total, invoice) => total + (invoice.compensation || 0), 0) || 0;
    }, [user?.invoices]);

    const completedCount = useMemo(() => {
        const todayString = dayjs().format("YYYY-MM-DD");
        return user?.invoices?.filter(invoice => {
            if (!invoice.date_completed) return false;
            const invoiceDate = invoice.date_completed.slice(0, 10);
            return invoiceDate === todayString && !invoice.cancelled;
        })?.length || 0;
    }, [user?.invoices]);

    // Calculate route with times for the journey panel
    const routeWithTimes = useMemo(() => {
        return calculateRouteWithTimes(optimizedRoute);
    }, [optimizedRoute]);

    return (
        <>
            <S.Container>
                <S.Header>
                    <S.HeaderContent>
                        <S.PageTitle>
                            <Calendar size={24} />
                            Today's Walks
                        </S.PageTitle>
                        <S.PageSubtitle>
                            {todaysAppointments.length} {todaysAppointments.length === 1 ? 'walk' : 'walks'} scheduled • {completedCount} completed
                        </S.PageSubtitle>
                    </S.HeaderContent>
                    {todaysAppointments.length > 0 && (
                        <S.HeaderButtonGroup>
                            {todaysAppointments.length > 1 && (
                                <S.OptimizedRouteButton
                                    onClick={fetchOptimizedRoute}
                                    disabled={isLoadingRoute}
                                    title="Get optimized route"
                                >
                                    <Route size={18} />
                                </S.OptimizedRouteButton>
                            )}
                            <S.HeaderButton onClick={() => setShowMap(true)}>
                                <Map size={18} />
                            </S.HeaderButton>
                        </S.HeaderButtonGroup>
                    )}
                </S.Header>

                {todaysAppointments.length === 0 ? (
                    <S.EmptyState>
                        <S.EmptyIcon>
                            <Dog size={48} />
                        </S.EmptyIcon>
                        <S.EmptyTitle>No walks scheduled</S.EmptyTitle>
                        <S.EmptyText>Enjoy your free day! Your furry friends are taking a rest.</S.EmptyText>
                    </S.EmptyState>
                ) : (
                    <>
                        {routeWithTimes && (
                            <RouteJourneyPanel
                                routeWithTimes={routeWithTimes}
                                onClose={() => setOptimizedRoute(null)}
                                inline={true}
                                mapStyle="dark"
                            />
                        )}

                        <S.WalkList>
                            {todaysAppointments.map(appointment => (
                                <WalkCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    isCovering={false}
                                    coveredBy={null}
                                    myPercentage={null}
                                />
                            ))}
                        </S.WalkList>

                        <S.DailyTotalCard>
                            <S.DailyTotalHeader>
                                <DollarSign size={24} />
                                Today's Earnings
                            </S.DailyTotalHeader>
                            <S.DailyTotalAmount>${dailyEarnings.toFixed(2)}</S.DailyTotalAmount>
                            <S.DailyTotalSub>
                                {completedCount} {completedCount === 1 ? 'walk' : 'walks'} completed
                            </S.DailyTotalSub>
                        </S.DailyTotalCard>
                    </>
                )}
            </S.Container>

            {showMap && (
                <WalksMapView
                    walks={todaysAppointments}
                    isCompleted={(walk) => hasInvoiceForToday(walk, user?.invoices)}
                    onClose={() => setShowMap(false)}
                />
            )}
        </>
    );
}

const hasInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        if (!invoice.date_completed) return false;
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && !invoice.cancelled;
    });
};

const hasCancelledInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        if (!invoice.date_completed) return false;
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && invoice.cancelled;
    });
};

const getInvoiceAmountForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    const invoice = invoices?.find(invoice => {
        if (!invoice.date_completed) return false;
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && !invoice.cancelled;
    });
    return invoice?.compensation || 0;
};

const WalkCard = React.memo(({ appointment, isCovering, coveredBy, myPercentage }) => {
    const { user, addInvoice } = useContext(UserContext);
    const [isCompleted, setIsCompleted] = useState(
        hasInvoiceForToday(appointment, user?.invoices)
    );
    const [isCancelled, setIsCancelled] = useState(
        hasCancelledInvoiceForToday(appointment, user?.invoices)
    );
    const [invoiceAmount, setInvoiceAmount] = useState(
        getInvoiceAmountForToday(appointment, user?.invoices)
    );
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPetModal, setShowPetModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Helper to get walk type - supports both walk_type field and legacy solo field
    const walkType = appointment.walk_type || (appointment.solo ? 'solo' : 'group');
    const walkTypeDisplay = walkType === 'solo' ? 'Solo' : walkType === 'training' ? 'Training' : walkType === 'sibling' ? 'Sibling' : 'Group';

    // Update state when invoices change in context
    React.useEffect(() => {
        setIsCompleted(hasInvoiceForToday(appointment, user?.invoices));
        setIsCancelled(hasCancelledInvoiceForToday(appointment, user?.invoices));
        setInvoiceAmount(getInvoiceAmountForToday(appointment, user?.invoices));
    }, [user?.invoices, appointment]);

    const handleCompleteWalk = async (offset = 0, duration = appointment.duration, splitData = null) => {
        let compensation = duration === 30 ? user.thirty
            : duration === 45 ? user.fortyfive
            : duration === 60 ? user.sixty
            : 0;

        // Add upcharge based on walk type
        const walkType = appointment.walk_type || (appointment.solo ? 'solo' : 'group');
        if (walkType === 'solo') {
            compensation += user.solo_rate || 0;
        } else if (walkType === 'training') {
            compensation += user.training_rate || 0;
        } else if (walkType === 'sibling') {
            compensation += user.sibling_rate || 0;
        }

        compensation += offset;

        const invoiceData = {
            pet_id: appointment.pet.id,
            appointment_id: appointment.id,
            date_completed: dayjs().toISOString(),
            paid: false,
            compensation,
            title: `${duration} min ${walkType} walk`
        };

        // Add split data if provided
        if (splitData) {
            invoiceData.split_percentage = splitData.splitPercentage;
            if (splitData.completedByUserId) {
                invoiceData.completed_by_user_id = splitData.completedByUserId;
            }
        }

        const token = localStorage.getItem("token");
        const response = await fetch("/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ invoice: invoiceData }),
        });

        if (response.ok) {
            const responseData = await response.json();
            // Use smart update - prevents full re-render
            // Backend returns {invoice, training_session, new_milestone}
            addInvoice(responseData.invoice);
            setShowCompletionModal(false);
        }
    };

    const handleCancelWalk = async (cancellationFee = 0) => {
        const token = localStorage.getItem("token");
        const response = await fetch("/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                pet_id: appointment.pet.id,
                appointment_id: appointment.id,
                date_completed: dayjs().toISOString(),
                paid: false,
                compensation: parseFloat(cancellationFee) || 0,
                title: `Canceled ${appointment.duration} min ${walkType} walk`,
                cancelled: true
            }),
        });

        if (response.ok) {
            const responseData = await response.json();
            // Use smart update - prevents full re-render
            // Backend returns {invoice, training_session, new_milestone}
            addInvoice(responseData.invoice);
            setShowCancelModal(false);
        }
    };

    return (
        <S.Card $completed={isCompleted} $cancelled={isCancelled}>
            <S.CardContent>
                <S.WalkDetails onClick={() => setShowPetModal(true)}>
                    <S.TopRow>
                        <S.PetName>{appointment.pet?.name}</S.PetName>
                        <S.WalkTime>
                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(appointment.end_time, "HH:mm").format("h:mm A")}
                        </S.WalkTime>
                    </S.TopRow>
                    <S.Address>
                        <MapPin size={11} />
                        {appointment.pet?.address || 'No address'}
                    </S.Address>
                    <S.WalkInfo>
                        <S.InfoItem>
                            {appointment.duration}min
                        </S.InfoItem>
                        <S.InfoDivider>•</S.InfoDivider>
                        <S.InfoItem>
                            {walkTypeDisplay}
                        </S.InfoItem>
                        <S.InfoDivider>•</S.InfoDivider>
                        <S.InfoItem>
                            <S.InfoIcon>
                                <Info size={12} />
                            </S.InfoIcon>
                        </S.InfoItem>
                    </S.WalkInfo>

                    {/* Badge for covering appointments */}
                    {isCovering && myPercentage && (
                        <S.CoveringBadge>
                            <CheckCircle size={14} />
                            Covering ({myPercentage}%)
                        </S.CoveringBadge>
                    )}

                    {/* Badge for covered-by appointments */}
                    {coveredBy && (
                        <S.CoveredByBadge>
                            <Share2 size={14} />
                            Covered by {coveredBy.name}
                        </S.CoveredByBadge>
                    )}
                </S.WalkDetails>

                {isCompleted && invoiceAmount > 0 && (
                    <S.EarningsDisplay>
                        <DollarSign size={16} />
                        <S.EarningsAmount>${invoiceAmount.toFixed(2)}</S.EarningsAmount>
                    </S.EarningsDisplay>
                )}

                {!isCompleted && !isCancelled && (
                    <S.ActionButtons>
                        {/* Only show share button if this is owned appointment (not covering) */}
                        {!isCovering && (
                            <S.ShareButton onClick={() => setShowShareModal(true)} title="Share with team">
                                <Share2 size={18} />
                            </S.ShareButton>
                        )}
                        {/* Only enable complete if covering OR not covered by someone else */}
                        <S.CompleteButton
                            onClick={() => setShowCompletionModal(true)}
                            disabled={coveredBy !== null}
                            style={{
                                opacity: coveredBy ? 0.5 : 1,
                                cursor: coveredBy ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <CheckCircle size={18} />
                        </S.CompleteButton>
                        {/* Only show cancel for owned appointments */}
                        {!isCovering && (
                            <S.CancelButton onClick={() => setShowCancelModal(true)}>
                                <X size={18} />
                            </S.CancelButton>
                        )}
                    </S.ActionButtons>
                )}

                {appointment.delegation_status === 'delegated' && !isCompleted && !isCancelled && !isCovering && !coveredBy && (
                    <S.DelegatedBadge>
                        <Share2 size={12} />
                        Shared
                    </S.DelegatedBadge>
                )}

                {isCompleted && (
                    <S.CompletedBadge>
                        <CheckCircle size={14} />
                    </S.CompletedBadge>
                )}
                {isCancelled && (
                    <S.CancelledBadge>
                        <X size={14} />
                    </S.CancelledBadge>
                )}
            </S.CardContent>

            {showCompletionModal && (
                <CompletionModal
                    appointment={appointment}
                    user={user}
                    onComplete={handleCompleteWalk}
                    onClose={() => setShowCompletionModal(false)}
                />
            )}

            {showCancelModal && (
                <CancelModal
                    appointment={appointment}
                    onCancel={handleCancelWalk}
                    onClose={() => setShowCancelModal(false)}
                />
            )}

            {showPetModal && (
                <PetDetailsModal
                    pet={appointment.pet}
                    onClose={() => setShowPetModal(false)}
                />
            )}

            {showShareModal && (
                <ShareAppointmentModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    appointment={appointment}
                />
            )}
        </S.Card>
    );
});

// Completion Modal Component
const CompletionModal = ({ appointment, user, onComplete, onClose }) => {
    const [offset, setOffset] = useState(0);
    const [offsetType, setOffsetType] = useState('upcharge');
    const [duration, setDuration] = useState(appointment.duration);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [splitPercentage, setSplitPercentage] = useState(100); // % going to walker
    const [showSplitUI, setShowSplitUI] = useState(appointment.delegation_status === 'delegated');

    // Use original owner's rates if this is a covering appointment
    const rates = appointment.is_covering && appointment.original_owner_rates
        ? appointment.original_owner_rates
        : user;

    const baseCompensation = duration === 30 ? (rates.thirty || 0)
        : duration === 45 ? (rates.fortyfive || 0)
        : duration === 60 ? (rates.sixty || 0)
        : 0;

    const walkType = appointment.walk_type || (appointment.solo ? 'solo' : 'group');
    const walkTypeDisplay = walkType === 'solo' ? 'Solo' : walkType === 'training' ? 'Training' : walkType === 'sibling' ? 'Sibling' : 'Group';
    const isSoloWalk = walkType === 'solo';
    const walkUpcharge = walkType === 'solo' ? (rates.solo_rate || 0)
        : walkType === 'training' ? (rates.training_rate || 0)
        : walkType === 'sibling' ? (rates.sibling_rate || 0)
        : 0;

    const totalBeforeSplit = baseCompensation + walkUpcharge + (offsetType === 'upcharge' ? offset : -offset);

    // Calculate covering walker's share if this is a covering appointment
    const myShare = appointment.is_covering && appointment.my_percentage
        ? (totalBeforeSplit * appointment.my_percentage / 100)
        : totalBeforeSplit;

    const ownerShare = appointment.is_covering && appointment.my_percentage
        ? (totalBeforeSplit * (100 - appointment.my_percentage) / 100)
        : 0;

    const finalAmount = myShare;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const finalOffset = offsetType === 'upcharge' ? offset : -offset;

        const splitData = showSplitUI ? {
            splitPercentage: splitPercentage,
            completedByUserId: null // Will be set when we know who completed it
        } : null;

        await onComplete(finalOffset, duration, splitData);
        setIsSubmitting(false);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isSubmitting]);

    const modalContent = (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        zIndex: 10002
                    }}
                >
                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <S.CompletionModalContainer>
                            <S.CompletionModalDragHandle />

                            <S.CompletionModalHeader>
                                <S.CompletionModalHeaderTop>
                                    <S.CompletionModalTitle>Complete Walk</S.CompletionModalTitle>
                                    <S.CompletionModalCloseButton onClick={onClose} disabled={isSubmitting}>
                                        <X size={20} />
                                    </S.CompletionModalCloseButton>
                                </S.CompletionModalHeaderTop>
                                <S.PetInfoBanner>
                                    <S.PetNameLarge>{appointment.pet?.name}</S.PetNameLarge>
                                    <S.WalkMetadata>
                                        <S.WalkTypeChip $solo={isSoloWalk}>
                                            {walkTypeDisplay}
                                        </S.WalkTypeChip>
                                        <S.WalkTimeText>
                                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")}
                                        </S.WalkTimeText>
                                    </S.WalkMetadata>
                                </S.PetInfoBanner>
                            </S.CompletionModalHeader>

                            <S.CompletionModalContent>
                                <S.CompensationCard>
                                    <S.CompensationCardTitle>
                                        {appointment.is_covering ? 'Split Compensation' : 'Compensation'}
                                    </S.CompensationCardTitle>
                                    <S.CompensationBreakdown>
                                        <S.CompensationItem>
                                            <S.CompensationItemLabel>Base Rate</S.CompensationItemLabel>
                                            <S.CompensationItemValue>${baseCompensation.toFixed(2)}</S.CompensationItemValue>
                                        </S.CompensationItem>
                                        {walkUpcharge > 0 && (
                                            <S.CompensationItem>
                                                <S.CompensationItemLabel>{walkType.charAt(0).toUpperCase() + walkType.slice(1)} Upcharge</S.CompensationItemLabel>
                                                <S.CompensationItemValue $accent>+${walkUpcharge.toFixed(2)}</S.CompensationItemValue>
                                            </S.CompensationItem>
                                        )}
                                        {appointment.is_covering && (
                                            <>
                                                <S.CompensationItem style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                                                    <S.CompensationItemLabel>Total Walk Price</S.CompensationItemLabel>
                                                    <S.CompensationItemValue>${totalBeforeSplit.toFixed(2)}</S.CompensationItemValue>
                                                </S.CompensationItem>
                                                <S.CompensationItem>
                                                    <S.CompensationItemLabel>Your Share ({appointment.my_percentage}%)</S.CompensationItemLabel>
                                                    <S.CompensationItemValue $accent>${myShare.toFixed(2)}</S.CompensationItemValue>
                                                </S.CompensationItem>
                                                <S.CompensationItem>
                                                    <S.CompensationItemLabel>Owner's Share ({100 - appointment.my_percentage}%)</S.CompensationItemLabel>
                                                    <S.CompensationItemValue>${ownerShare.toFixed(2)}</S.CompensationItemValue>
                                                </S.CompensationItem>
                                            </>
                                        )}
                                    </S.CompensationBreakdown>
                                </S.CompensationCard>

                                <S.DurationSection>
                                    <S.SectionLabel>Duration</S.SectionLabel>
                                    <S.DurationSelector>
                                        <S.DurationOption
                                            $active={duration === 30}
                                            onClick={() => setDuration(30)}
                                            disabled={isSubmitting}
                                        >
                                            <S.DurationTime>30</S.DurationTime>
                                            <S.DurationUnit>min</S.DurationUnit>
                                        </S.DurationOption>
                                        <S.DurationOption
                                            $active={duration === 45}
                                            onClick={() => setDuration(45)}
                                            disabled={isSubmitting}
                                        >
                                            <S.DurationTime>45</S.DurationTime>
                                            <S.DurationUnit>min</S.DurationUnit>
                                        </S.DurationOption>
                                        <S.DurationOption
                                            $active={duration === 60}
                                            onClick={() => setDuration(60)}
                                            disabled={isSubmitting}
                                        >
                                            <S.DurationTime>60</S.DurationTime>
                                            <S.DurationUnit>min</S.DurationUnit>
                                        </S.DurationOption>
                                    </S.DurationSelector>
                                </S.DurationSection>

                                {!appointment.is_covering && (
                                    <S.AdjustmentSection>
                                        <S.SectionLabel>Adjustment (Optional)</S.SectionLabel>

                                        <S.AdjustmentTypeToggle>
                                            <S.AdjustmentTypeButton
                                                $active={offsetType === 'upcharge'}
                                                onClick={() => setOffsetType('upcharge')}
                                                disabled={isSubmitting}
                                            >
                                                <Plus size={16} />
                                                Add
                                            </S.AdjustmentTypeButton>
                                            <S.AdjustmentTypeButton
                                                $active={offsetType === 'discount'}
                                                onClick={() => setOffsetType('discount')}
                                                disabled={isSubmitting}
                                            >
                                                <Minus size={16} />
                                                Subtract
                                            </S.AdjustmentTypeButton>
                                        </S.AdjustmentTypeToggle>

                                        <S.AdjustmentInput>
                                            <DollarSign size={18} />
                                            <input
                                                type="number"
                                                value={offset}
                                                onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </S.AdjustmentInput>
                                    </S.AdjustmentSection>
                                )}

                                {showSplitUI && (
                                    <S.SplitSection>
                                        <S.SectionLabel>Payment Split</S.SectionLabel>
                                        <S.SplitInfo>This appointment was shared. Set payment split:</S.SplitInfo>

                                        <S.SplitSliderContainer>
                                            <S.SplitSlider
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={splitPercentage}
                                                onChange={(e) => setSplitPercentage(parseFloat(e.target.value))}
                                                disabled={isSubmitting}
                                            />
                                            <S.SplitLabels>
                                                <S.SplitLabel>You: {(100 - splitPercentage).toFixed(0)}%</S.SplitLabel>
                                                <S.SplitLabel>Walker: {splitPercentage.toFixed(0)}%</S.SplitLabel>
                                            </S.SplitLabels>
                                        </S.SplitSliderContainer>

                                        <S.SplitBreakdown>
                                            <S.SplitItem>
                                                <S.SplitItemLabel>Your share:</S.SplitItemLabel>
                                                <S.SplitItemValue>${(finalAmount * ((100 - splitPercentage) / 100)).toFixed(2)}</S.SplitItemValue>
                                            </S.SplitItem>
                                            <S.SplitItem>
                                                <S.SplitItemLabel>Walker's share:</S.SplitItemLabel>
                                                <S.SplitItemValue>${(finalAmount * (splitPercentage / 100)).toFixed(2)}</S.SplitItemValue>
                                            </S.SplitItem>
                                        </S.SplitBreakdown>
                                    </S.SplitSection>
                                )}

                                <S.TotalCard $positive={finalAmount >= 0}>
                                    <S.TotalLabel>
                                        {appointment.is_covering ? 'Your Earning' : 'Total Payment'}
                                    </S.TotalLabel>
                                    <S.TotalAmount>${finalAmount.toFixed(2)}</S.TotalAmount>
                                </S.TotalCard>

                                <S.ModalActions>
                                    <S.ConfirmButton onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Complete Walk
                                            </>
                                        )}
                                    </S.ConfirmButton>
                                    <S.CancelActionButton onClick={onClose} disabled={isSubmitting}>
                                        Cancel
                                    </S.CancelActionButton>
                                </S.ModalActions>
                            </S.CompletionModalContent>
                        </S.CompletionModalContainer>
                    </motion.div>
                </motion.div>
            </>
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Cancel Modal Component
const CancelModal = ({ appointment, onCancel, onClose }) => {
    const [cancellationFee, setCancellationFee] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const walkType = appointment.walk_type || (appointment.solo ? 'solo' : 'group');
    const walkTypeDisplay = walkType === 'solo' ? 'Solo' : walkType === 'training' ? 'Training' : walkType === 'sibling' ? 'Sibling' : 'Group';
    const isSoloWalk = walkType === 'solo';

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onCancel(cancellationFee);
        setIsSubmitting(false);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isSubmitting]);

    const modalContent = (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleOverlayClick}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        zIndex: 10002
                    }}
                >
                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <S.CancelModalContainer>
                            <S.CancelModalDragHandle />

                            <S.CancelModalHeader>
                                <S.CancelModalHeaderTop>
                                    <S.CancelModalTitle>Cancel Walk</S.CancelModalTitle>
                                    <S.CancelModalCloseButton onClick={onClose} disabled={isSubmitting}>
                                        <X size={20} />
                                    </S.CancelModalCloseButton>
                                </S.CancelModalHeaderTop>
                                <S.PetInfoBanner>
                                    <S.PetNameLarge>{appointment.pet?.name}</S.PetNameLarge>
                                    <S.WalkMetadata>
                                        <S.WalkTypeChip $solo={isSoloWalk}>
                                            {walkTypeDisplay}
                                        </S.WalkTypeChip>
                                        <S.WalkTimeText>
                                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")}
                                        </S.WalkTimeText>
                                    </S.WalkMetadata>
                                </S.PetInfoBanner>
                            </S.CancelModalHeader>

                            <S.CancelModalContent>
                                <S.CancellationInfoCard>
                                    <S.CancellationWarning>
                                        <X size={24} />
                                    </S.CancellationWarning>
                                    <S.CancellationMessage>
                                        This walk will be marked as cancelled. You can optionally add a cancellation fee below.
                                    </S.CancellationMessage>
                                </S.CancellationInfoCard>

                                <S.CancellationFeeSection>
                                    <S.SectionLabel>Cancellation Fee (Optional)</S.SectionLabel>

                                    <S.FeeInputWrapper>
                                        <DollarSign size={20} />
                                        <input
                                            type="number"
                                            value={cancellationFee}
                                            onChange={(e) => setCancellationFee(parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            disabled={isSubmitting}
                                        />
                                    </S.FeeInputWrapper>

                                    <S.FeeHint>
                                        Leave at $0 for no charge or enter an amount to bill for the cancellation.
                                    </S.FeeHint>
                                </S.CancellationFeeSection>

                                <S.CancelModalActions>
                                    <S.CancelWalkButton onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <X size={18} />
                                                Confirm Cancellation
                                            </>
                                        )}
                                    </S.CancelWalkButton>
                                    <S.KeepWalkButton onClick={onClose} disabled={isSubmitting}>
                                        Keep Walk
                                    </S.KeepWalkButton>
                                </S.CancelModalActions>
                            </S.CancelModalContent>
                        </S.CancelModalContainer>
                    </motion.div>
                </motion.div>
            </>
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

// Pet Details Modal Component
const PetDetailsModal = ({ pet, onClose }) => {

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

    const calculateAge = (birthdate) => {
        if (!birthdate) return 'Unknown';
        const today = dayjs();
        const birth = dayjs(birthdate);
        const years = today.diff(birth, 'year');
        const months = today.diff(birth.add(years, 'year'), 'month');
        
        if (years === 0) {
            return months === 1 ? '1 month old' : `${months} months old`;
        }
        return years === 1 ? '1 year old' : `${years} years old`;
    };

    const modalContent = (
        <S.PetModalOverlay onClick={handleOverlayClick}>
            <S.PetModalContainer>
                <S.PetModalHeader>
                    <S.PetModalTitle>
                        <Info size={24} />
                        Pet Details
                    </S.PetModalTitle>
                    <S.PetModalCloseButton onClick={onClose}>
                        <X size={18} />
                    </S.PetModalCloseButton>
                </S.PetModalHeader>
                
                <S.PetModalContent>
                    <S.PetMainInfo>
                        <S.PetModalAvatar
                            src={dogPlaceholder}
                            alt={pet?.name}
                            loading="lazy"
                        />
                        <S.PetNameContainer>
                            <S.PetModalName>{pet?.name || 'Unknown'}</S.PetModalName>
                            <S.PetBreed>Beloved Pet</S.PetBreed>
                        </S.PetNameContainer>
                    </S.PetMainInfo>

                    <S.PetDetailsGrid>
                        <S.PetDetailItem>
                            <S.DetailIcon>
                                <Cake size={18} />
                            </S.DetailIcon>
                            <S.DetailContent>
                                <S.DetailLabel>Age</S.DetailLabel>
                                <S.DetailValue>{calculateAge(pet?.birthdate)}</S.DetailValue>
                            </S.DetailContent>
                        </S.PetDetailItem>

                        <S.PetDetailItem>
                            <S.DetailIcon>
                                <User size={18} />
                            </S.DetailIcon>
                            <S.DetailContent>
                                <S.DetailLabel>Sex</S.DetailLabel>
                                <S.DetailValue>{pet?.sex || 'Not specified'}</S.DetailValue>
                            </S.DetailContent>
                        </S.PetDetailItem>

                        <S.PetDetailItem>
                            <S.DetailIcon>
                                <MapPin size={18} />
                            </S.DetailIcon>
                            <S.DetailContent>
                                <S.DetailLabel>Address</S.DetailLabel>
                                <S.DetailValue>{pet?.address || 'Not specified'}</S.DetailValue>
                            </S.DetailContent>
                        </S.PetDetailItem>

                        <S.PetDetailItem>
                            <S.DetailIcon>
                                <Heart size={18} />
                            </S.DetailIcon>
                            <S.DetailContent>
                                <S.DetailLabel>Spayed/Neutered</S.DetailLabel>
                                <S.DetailValue>{pet?.spayed_neutered ? 'Yes' : 'No'}</S.DetailValue>
                            </S.DetailContent>
                        </S.PetDetailItem>
                    </S.PetDetailsGrid>

                    {pet?.allergies && pet.allergies.trim() && pet.allergies.toLowerCase() !== 'none' && (
                        <S.NotesSection>
                            <S.NotesTitle>🚫 Allergies</S.NotesTitle>
                            <S.NotesText>{pet.allergies}</S.NotesText>
                        </S.NotesSection>
                    )}

                    {pet?.behavioral_notes && pet.behavioral_notes.trim() && (
                        <S.NotesSection>
                            <S.NotesTitle>🐕 Behavioral Notes</S.NotesTitle>
                            <S.NotesText>{pet.behavioral_notes}</S.NotesText>
                        </S.NotesSection>
                    )}

                    {pet?.supplies_location && pet.supplies_location.trim() && (
                        <S.NotesSection>
                            <S.NotesTitle>🎒 Supplies Location</S.NotesTitle>
                            <S.NotesText>{pet.supplies_location}</S.NotesText>
                        </S.NotesSection>
                    )}
                </S.PetModalContent>
            </S.PetModalContainer>
        </S.PetModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
