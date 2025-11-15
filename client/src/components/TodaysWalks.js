import React, { useContext, useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
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
    Route,
    Sparkles
} from "lucide-react";
import ShareAppointmentModal from "./ShareAppointmentModal";
import WalksMapView from "./WalksMapView";

export default function TodaysWalks() {
    const { user, refreshUser, addInvoice } = useContext(UserContext);
    const [showMap, setShowMap] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Helper to check if recurring appointment occurs on a specific date
    const isRecurringOnDate = useCallback((appointment, date) => {
        const dayOfWeek = dayjs(date).day();  // Returns 0-6 (Sunday-Saturday)
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

    // Get appointments for today using the same logic as Dashboard
    const getAppointmentsForToday = useCallback(() => {
        const today = dayjs().format("YYYY-MM-DD");
        return (user?.appointments
            ?.filter(appointment => {
                if (appointment.canceled) return false;

                const formattedDate = today;
                const hasCancellation = appointment.cancellations?.some(cancellation =>
                    dayjs(cancellation.date).format("YYYY-MM-DD") === formattedDate
                );
                if (hasCancellation) return false;

                if (appointment.recurring) {
                    return isRecurringOnDate(appointment, today);
                }
                return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === formattedDate;
            })
            || []);
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

    // Get today's appointments using the same pattern as Dashboard
    const todaysAppointments = useMemo(() => {
        const appointments = getAppointmentsForToday();

        // Sort by start time
        return appointments.sort((a, b) => {
            const startA = dayjs(a.start_time, "HH:mm");
            const startB = dayjs(b.start_time, "HH:mm");
            const endA = dayjs(a.end_time, "HH:mm");
            const endB = dayjs(b.end_time, "HH:mm");

            if (startA.isBefore(startB)) return -1;
            if (startA.isAfter(startB)) return 1;

            return endA.isBefore(endB) ? -1 : 1;
        });
    }, [getAppointmentsForToday]);

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

    return (
        <>
            <Container>
                <Header>
                    <HeaderContent>
                        <PageTitle>
                            <Calendar size={24} />
                            Today's Walks
                        </PageTitle>
                        <PageSubtitle>
                            {todaysAppointments.length} {todaysAppointments.length === 1 ? 'walk' : 'walks'} scheduled • {completedCount} completed
                        </PageSubtitle>
                    </HeaderContent>
                    {todaysAppointments.length > 0 && (
                        <HeaderButtonGroup>
                            {todaysAppointments.length > 1 && (
                                <OptimizedRouteButton
                                    onClick={fetchOptimizedRoute}
                                    disabled={isLoadingRoute}
                                    title="Get optimized route"
                                >
                                    <Route size={18} />
                                </OptimizedRouteButton>
                            )}
                            <HeaderButton onClick={() => setShowMap(true)}>
                                <Map size={18} />
                            </HeaderButton>
                        </HeaderButtonGroup>
                    )}
                </Header>

                {todaysAppointments.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>
                            <Dog size={48} />
                        </EmptyIcon>
                        <EmptyTitle>No walks scheduled</EmptyTitle>
                        <EmptyText>Enjoy your free day! Your furry friends are taking a rest.</EmptyText>
                    </EmptyState>
                ) : (
                    <>
                        {optimizedRoute && optimizedRoute.route && (
                            <RouteDisplayContainer>
                                <RouteHeader>
                                    <RouteHeaderLeft>
                                        <RouteTitle>
                                            <Sparkles size={18} />
                                            Optimized Route
                                        </RouteTitle>
                                        <RouteSummary>
                                            {optimizedRoute.route.length} stops
                                        </RouteSummary>
                                    </RouteHeaderLeft>
                                    <CloseRouteButton
                                        onClick={() => setOptimizedRoute(null)}
                                        title="Close optimized route"
                                    >
                                        <X size={20} />
                                    </CloseRouteButton>
                                </RouteHeader>
                                <RouteStops>
                                    {optimizedRoute.route.map((stop, index) => (
                                        <RouteStop key={index}>
                                            <StopNumber $type={stop.stop_type}>{index + 1}</StopNumber>
                                            <StopDetails>
                                                <StopType $type={stop.stop_type}>
                                                    {stop.stop_type === 'pickup' ? 'Pick up' : 'Drop off'}
                                                </StopType>
                                                <StopName>{stop.pet_name}</StopName>
                                                <StopTime>{stop.time}</StopTime>
                                            </StopDetails>
                                        </RouteStop>
                                    ))}
                                </RouteStops>
                            </RouteDisplayContainer>
                        )}

                        <WalkList>
                            {todaysAppointments.map(appointment => (
                                <WalkCard
                                    key={`${appointment.is_covering ? 'covering' : 'owned'}-${appointment.id}`}
                                    appointment={appointment}
                                    isCovering={appointment.is_covering || false}
                                    coveredBy={appointment.covered_by || null}
                                    myPercentage={appointment.my_percentage || null}
                                />
                            ))}
                        </WalkList>

                        <DailyTotalCard>
                            <DailyTotalHeader>
                                <DollarSign size={24} />
                                Today's Earnings
                            </DailyTotalHeader>
                            <DailyTotalAmount>${dailyEarnings.toFixed(2)}</DailyTotalAmount>
                            <DailyTotalSub>
                                {completedCount} {completedCount === 1 ? 'walk' : 'walks'} completed
                            </DailyTotalSub>
                        </DailyTotalCard>
                    </>
                )}
            </Container>

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
                title: `Canceled ${appointment.duration} min ${appointment.solo ? 'training' : 'group'} walk`,
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
        <Card $completed={isCompleted} $cancelled={isCancelled}>
            <CardContent>
                <WalkDetails>
                    <TopRow>
                        <PetName onClick={() => setShowPetModal(true)}>{appointment.pet?.name}</PetName>
                        <WalkTime>
                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")} - {dayjs(appointment.end_time, "HH:mm").format("h:mm A")}
                        </WalkTime>
                    </TopRow>
                    <Address>
                        <MapPin size={11} />
                        {appointment.pet?.address || 'No address'}
                    </Address>
                    <WalkInfo>
                        <InfoItem>
                            {appointment.duration}min
                        </InfoItem>
                        <InfoDivider>•</InfoDivider>
                        <InfoItem>
                            {appointment.solo ? 'Solo' : 'Group'}
                        </InfoItem>
                    </WalkInfo>

                    {/* Badge for covering appointments */}
                    {isCovering && myPercentage && (
                        <CoveringBadge>
                            <CheckCircle size={14} />
                            Covering ({myPercentage}%)
                        </CoveringBadge>
                    )}

                    {/* Badge for covered-by appointments */}
                    {coveredBy && (
                        <CoveredByBadge>
                            <Share2 size={14} />
                            Covered by {coveredBy.name}
                        </CoveredByBadge>
                    )}
                </WalkDetails>

                {isCompleted && invoiceAmount > 0 && (
                    <EarningsDisplay>
                        <DollarSign size={16} />
                        <EarningsAmount>${invoiceAmount.toFixed(2)}</EarningsAmount>
                    </EarningsDisplay>
                )}

                {!isCompleted && !isCancelled && (
                    <ActionButtons>
                        {/* Only show share button if this is owned appointment (not covering) */}
                        {!isCovering && (
                            <ShareButton onClick={() => setShowShareModal(true)} title="Share with team">
                                <Share2 size={18} />
                            </ShareButton>
                        )}
                        {/* Only enable complete if covering OR not covered by someone else */}
                        <CompleteButton
                            onClick={() => setShowCompletionModal(true)}
                            disabled={coveredBy !== null}
                            style={{
                                opacity: coveredBy ? 0.5 : 1,
                                cursor: coveredBy ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <CheckCircle size={18} />
                        </CompleteButton>
                        {/* Only show cancel for owned appointments */}
                        {!isCovering && (
                            <CancelButton onClick={() => setShowCancelModal(true)}>
                                <X size={18} />
                            </CancelButton>
                        )}
                    </ActionButtons>
                )}

                {appointment.delegation_status === 'delegated' && !isCompleted && !isCancelled && !isCovering && !coveredBy && (
                    <DelegatedBadge>
                        <Share2 size={12} />
                        Shared
                    </DelegatedBadge>
                )}

                {isCompleted && (
                    <CompletedBadge>
                        <CheckCircle size={14} />
                    </CompletedBadge>
                )}
                {isCancelled && (
                    <CancelledBadge>
                        <X size={14} />
                    </CancelledBadge>
                )}
            </CardContent>

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
        </Card>
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

    const baseCompensation = duration === 30 ? user.thirty
        : duration === 45 ? user.fortyfive
        : duration === 60 ? user.sixty
        : 0;

    const walkType = appointment.walk_type || (appointment.solo ? 'solo' : 'group');
    const walkUpcharge = walkType === 'solo' ? (user.solo_rate || 0)
        : walkType === 'training' ? (user.training_rate || 0)
        : walkType === 'sibling' ? (user.sibling_rate || 0)
        : 0;
    const finalAmount = baseCompensation + walkUpcharge + (offsetType === 'upcharge' ? offset : -offset);

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
                        <CompletionModalContainer>
                            <CompletionModalDragHandle />

                            <CompletionModalHeader>
                                <CompletionModalHeaderTop>
                                    <CompletionModalTitle>Complete Walk</CompletionModalTitle>
                                    <CompletionModalCloseButton onClick={onClose} disabled={isSubmitting}>
                                        <X size={20} />
                                    </CompletionModalCloseButton>
                                </CompletionModalHeaderTop>
                                <PetInfoBanner>
                                    <PetNameLarge>{appointment.pet?.name}</PetNameLarge>
                                    <WalkMetadata>
                                        <WalkTypeChip $solo={appointment.solo}>
                                            {appointment.solo ? 'Solo' : 'Group'}
                                        </WalkTypeChip>
                                        <WalkTimeText>
                                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")}
                                        </WalkTimeText>
                                    </WalkMetadata>
                                </PetInfoBanner>
                            </CompletionModalHeader>

                            <CompletionModalContent>
                                <CompensationCard>
                                    <CompensationCardTitle>Compensation</CompensationCardTitle>
                                    <CompensationBreakdown>
                                        <CompensationItem>
                                            <CompensationItemLabel>Base Rate</CompensationItemLabel>
                                            <CompensationItemValue>${baseCompensation.toFixed(2)}</CompensationItemValue>
                                        </CompensationItem>
                                        {walkUpcharge > 0 && (
                                            <CompensationItem>
                                                <CompensationItemLabel>{walkType.charAt(0).toUpperCase() + walkType.slice(1)} Upcharge</CompensationItemLabel>
                                                <CompensationItemValue $accent>+${walkUpcharge.toFixed(2)}</CompensationItemValue>
                                            </CompensationItem>
                                        )}
                                    </CompensationBreakdown>
                                </CompensationCard>

                                <DurationSection>
                                    <SectionLabel>Duration</SectionLabel>
                                    <DurationSelector>
                                        <DurationOption
                                            $active={duration === 30}
                                            onClick={() => setDuration(30)}
                                            disabled={isSubmitting}
                                        >
                                            <DurationTime>30</DurationTime>
                                            <DurationUnit>min</DurationUnit>
                                        </DurationOption>
                                        <DurationOption
                                            $active={duration === 45}
                                            onClick={() => setDuration(45)}
                                            disabled={isSubmitting}
                                        >
                                            <DurationTime>45</DurationTime>
                                            <DurationUnit>min</DurationUnit>
                                        </DurationOption>
                                        <DurationOption
                                            $active={duration === 60}
                                            onClick={() => setDuration(60)}
                                            disabled={isSubmitting}
                                        >
                                            <DurationTime>60</DurationTime>
                                            <DurationUnit>min</DurationUnit>
                                        </DurationOption>
                                    </DurationSelector>
                                </DurationSection>

                                <AdjustmentSection>
                                    <SectionLabel>Adjustment (Optional)</SectionLabel>

                                    <AdjustmentTypeToggle>
                                        <AdjustmentTypeButton
                                            $active={offsetType === 'upcharge'}
                                            onClick={() => setOffsetType('upcharge')}
                                            disabled={isSubmitting}
                                        >
                                            <Plus size={16} />
                                            Add
                                        </AdjustmentTypeButton>
                                        <AdjustmentTypeButton
                                            $active={offsetType === 'discount'}
                                            onClick={() => setOffsetType('discount')}
                                            disabled={isSubmitting}
                                        >
                                            <Minus size={16} />
                                            Subtract
                                        </AdjustmentTypeButton>
                                    </AdjustmentTypeToggle>

                                    <AdjustmentInput>
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
                                    </AdjustmentInput>
                                </AdjustmentSection>

                                {showSplitUI && (
                                    <SplitSection>
                                        <SectionLabel>Payment Split</SectionLabel>
                                        <SplitInfo>This appointment was shared. Set payment split:</SplitInfo>

                                        <SplitSliderContainer>
                                            <SplitSlider
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={splitPercentage}
                                                onChange={(e) => setSplitPercentage(parseFloat(e.target.value))}
                                                disabled={isSubmitting}
                                            />
                                            <SplitLabels>
                                                <SplitLabel>You: {(100 - splitPercentage).toFixed(0)}%</SplitLabel>
                                                <SplitLabel>Walker: {splitPercentage.toFixed(0)}%</SplitLabel>
                                            </SplitLabels>
                                        </SplitSliderContainer>

                                        <SplitBreakdown>
                                            <SplitItem>
                                                <SplitItemLabel>Your share:</SplitItemLabel>
                                                <SplitItemValue>${(finalAmount * ((100 - splitPercentage) / 100)).toFixed(2)}</SplitItemValue>
                                            </SplitItem>
                                            <SplitItem>
                                                <SplitItemLabel>Walker's share:</SplitItemLabel>
                                                <SplitItemValue>${(finalAmount * (splitPercentage / 100)).toFixed(2)}</SplitItemValue>
                                            </SplitItem>
                                        </SplitBreakdown>
                                    </SplitSection>
                                )}

                                <TotalCard $positive={finalAmount >= 0}>
                                    <TotalLabel>Total Payment</TotalLabel>
                                    <TotalAmount>${finalAmount.toFixed(2)}</TotalAmount>
                                </TotalCard>

                                <ModalActions>
                                    <ConfirmButton onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Complete Walk
                                            </>
                                        )}
                                    </ConfirmButton>
                                    <CancelActionButton onClick={onClose} disabled={isSubmitting}>
                                        Cancel
                                    </CancelActionButton>
                                </ModalActions>
                            </CompletionModalContent>
                        </CompletionModalContainer>
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
                        <CancelModalContainer>
                            <CancelModalDragHandle />

                            <CancelModalHeader>
                                <CancelModalHeaderTop>
                                    <CancelModalTitle>Cancel Walk</CancelModalTitle>
                                    <CancelModalCloseButton onClick={onClose} disabled={isSubmitting}>
                                        <X size={20} />
                                    </CancelModalCloseButton>
                                </CancelModalHeaderTop>
                                <PetInfoBanner>
                                    <PetNameLarge>{appointment.pet?.name}</PetNameLarge>
                                    <WalkMetadata>
                                        <WalkTypeChip $solo={appointment.solo}>
                                            {appointment.solo ? 'Solo' : 'Group'}
                                        </WalkTypeChip>
                                        <WalkTimeText>
                                            {dayjs(appointment.start_time, "HH:mm").format("h:mm A")}
                                        </WalkTimeText>
                                    </WalkMetadata>
                                </PetInfoBanner>
                            </CancelModalHeader>

                            <CancelModalContent>
                                <CancellationInfoCard>
                                    <CancellationWarning>
                                        <X size={24} />
                                    </CancellationWarning>
                                    <CancellationMessage>
                                        This walk will be marked as cancelled. You can optionally add a cancellation fee below.
                                    </CancellationMessage>
                                </CancellationInfoCard>

                                <CancellationFeeSection>
                                    <SectionLabel>Cancellation Fee (Optional)</SectionLabel>

                                    <FeeInputWrapper>
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
                                    </FeeInputWrapper>

                                    <FeeHint>
                                        Leave at $0 for no charge or enter an amount to bill for the cancellation.
                                    </FeeHint>
                                </CancellationFeeSection>

                                <CancelModalActions>
                                    <CancelWalkButton onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <X size={18} />
                                                Confirm Cancellation
                                            </>
                                        )}
                                    </CancelWalkButton>
                                    <KeepWalkButton onClick={onClose} disabled={isSubmitting}>
                                        Keep Walk
                                    </KeepWalkButton>
                                </CancelModalActions>
                            </CancelModalContent>
                        </CancelModalContainer>
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
        <PetModalOverlay onClick={handleOverlayClick}>
            <PetModalContainer>
                <PetModalHeader>
                    <PetModalTitle>
                        <Info size={24} />
                        Pet Details
                    </PetModalTitle>
                    <PetModalCloseButton onClick={onClose}>
                        <X size={18} />
                    </PetModalCloseButton>
                </PetModalHeader>
                
                <PetModalContent>
                    <PetMainInfo>
                        <PetModalAvatar
                            src={dogPlaceholder}
                            alt={pet?.name}
                            loading="lazy"
                        />
                        <PetNameContainer>
                            <PetModalName>{pet?.name || 'Unknown'}</PetModalName>
                            <PetBreed>Beloved Pet</PetBreed>
                        </PetNameContainer>
                    </PetMainInfo>

                    <PetDetailsGrid>
                        <PetDetailItem>
                            <DetailIcon>
                                <Cake size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Age</DetailLabel>
                                <DetailValue>{calculateAge(pet?.birthdate)}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        <PetDetailItem>
                            <DetailIcon>
                                <User size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Sex</DetailLabel>
                                <DetailValue>{pet?.sex || 'Not specified'}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        <PetDetailItem>
                            <DetailIcon>
                                <MapPin size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Address</DetailLabel>
                                <DetailValue>{pet?.address || 'Not specified'}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>

                        <PetDetailItem>
                            <DetailIcon>
                                <Heart size={18} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>Spayed/Neutered</DetailLabel>
                                <DetailValue>{pet?.spayed_neutered ? 'Yes' : 'No'}</DetailValue>
                            </DetailContent>
                        </PetDetailItem>
                    </PetDetailsGrid>

                    {pet?.allergies && pet.allergies.trim() && pet.allergies.toLowerCase() !== 'none' && (
                        <NotesSection>
                            <NotesTitle>🚫 Allergies</NotesTitle>
                            <NotesText>{pet.allergies}</NotesText>
                        </NotesSection>
                    )}

                    {pet?.behavioral_notes && pet.behavioral_notes.trim() && (
                        <NotesSection>
                            <NotesTitle>🐕 Behavioral Notes</NotesTitle>
                            <NotesText>{pet.behavioral_notes}</NotesText>
                        </NotesSection>
                    )}

                    {pet?.supplies_location && pet.supplies_location.trim() && (
                        <NotesSection>
                            <NotesTitle>🎒 Supplies Location</NotesTitle>
                            <NotesText>{pet.supplies_location}</NotesText>
                        </NotesSection>
                    )}
                </PetModalContent>
            </PetModalContainer>
        </PetModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

const Container = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 8px 16px;
    padding-top: 140px;
    padding-bottom: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 2px, transparent 2px),
            radial-gradient(circle at 80% 40%, rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.06) 2.5px, transparent 2.5px),
            radial-gradient(circle at 15% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(circle at 90% 15%, rgba(255,255,255,0.04) 1.5px, transparent 1.5px);
        background-size: 80px 80px, 60px 60px, 40px 40px, 100px 100px, 30px 30px, 70px 70px;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        padding: 16px 0;
        padding-top: 90px;
        padding-bottom: 140px;
    }
`;

const Header = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (max-width: 768px) {
        padding: 16px 12px;
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

const PageTitle = styled.h1`
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    @media (min-width: 768px) {
        font-size: 32px;
    }
`;

const PageSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const OptimizedRouteButton = styled.button`
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    backdrop-filter: blur(12px);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
        0 4px 12px rgba(251, 191, 36, 0.4),
        0 0 20px rgba(251, 191, 36, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 70%
        );
        animation: gleam 3s infinite;
    }

    @keyframes gleam {
        0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
        }
    }

    &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow:
            0 6px 20px rgba(251, 191, 36, 0.5),
            0 0 30px rgba(251, 191, 36, 0.4);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    svg {
        position: relative;
        z-index: 1;
    }

    @media (min-width: 768px) {
        width: 44px;
        height: 44px;

        svg {
            width: 20px;
            height: 20px;
        }
    }
`;

const RouteDisplayContainer = styled.div`
    width: 100%;
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border-top: 2px solid rgba(251, 191, 36, 0.4);
    border-bottom: 2px solid rgba(251, 191, 36, 0.4);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    margin-bottom: 0;
    position: relative;
    z-index: 1;
`;

const RouteHeader = styled.div`
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

const RouteHeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
`;

const RouteTitle = styled.div`
    color: rgba(251, 191, 36, 0.95);
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
`;

const RouteSummary = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
`;

const CloseRouteButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const RouteStops = styled.div`
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(251, 191, 36, 0.3);
        border-radius: 3px;

        &:hover {
            background: rgba(251, 191, 36, 0.5);
        }
    }
`;

const RouteStop = styled.div`
    display: flex;
    gap: 12px;
    position: relative;

    &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 19px;
        top: 40px;
        bottom: -12px;
        width: 2px;
        background: rgba(251, 191, 36, 0.2);
    }
`;

const StopNumber = styled.div`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: ${({ $type }) =>
        $type === 'pickup'
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const StopDetails = styled.div`
    flex: 1;
    padding-top: 2px;
`;

const StopType = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${props => props.$type === 'pickup' ? '#10b981' : '#8b5cf6'};
    margin-bottom: 4px;
`;

const StopName = styled.div`
    color: white;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
`;

const StopTime = styled.div`
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
`;

// Empty state styling
const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 32px;
    text-align: center;
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.8), rgba(107, 43, 107, 0.6));
    border-radius: 0;
    border: none;
    backdrop-filter: blur(15px);
    box-shadow: none;
    max-width: 500px;
    width: 100%;

    @media (min-width: 768px) {
        padding: 60px 40px;
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
`;

const EmptyIcon = styled.div`
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
`;

const EmptyTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const EmptyText = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    max-width: 350px;
    line-height: 1.5;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

// Walk list styling
const WalkList = styled.div`
    width: 100%;
    max-width: 448px;
    display: flex;
    flex-direction: column;
    gap: 0;

    @media (min-width: 768px) {
        gap: 12px;
    }
`;

// Sleek modern walk card
const Card = styled.div`
    background: ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(255, 255, 255, 0.18)' :
        $cancelled ? 'rgba(255, 255, 255, 0.12)' :
        'rgba(255, 255, 255, 0.15)'
    };
    backdrop-filter: blur(20px);
    border-radius: 0;
    border: none;
    border-bottom: 2px solid ${({ $completed, $cancelled }) =>
        $completed ? 'rgba(6, 182, 212, 0.5)' :
        $cancelled ? 'rgba(251, 146, 60, 0.5)' :
        'rgba(255, 255, 255, 0.25)'
    };
    box-shadow: none;
    transition: all 0.2s ease;
    opacity: ${({ $cancelled }) => $cancelled ? 0.7 : 1};

    &:active {
        background: ${({ $completed, $cancelled }) =>
            $completed ? 'rgba(255, 255, 255, 0.22)' :
            $cancelled ? 'rgba(255, 255, 255, 0.16)' :
            'rgba(255, 255, 255, 0.2)'
        };
    }

    @media (min-width: 769px) {
        border-radius: 16px;
        border: 2px solid ${({ $completed, $cancelled }) =>
            $completed ? 'rgba(6, 182, 212, 0.5)' :
            $cancelled ? 'rgba(251, 146, 60, 0.5)' :
            'rgba(255, 255, 255, 0.3)'
        };
        box-shadow: ${({ $completed, $cancelled }) =>
            $completed ? '0 4px 16px rgba(6, 182, 212, 0.3)' :
            $cancelled ? '0 4px 16px rgba(251, 146, 60, 0.3)' :
            '0 4px 16px rgba(0, 0, 0, 0.15)'
        };

        &:hover {
            transform: translateY(-2px);
            box-shadow: ${({ $completed, $cancelled }) =>
                $completed ? '0 8px 24px rgba(6, 182, 212, 0.4)' :
                $cancelled ? '0 8px 24px rgba(251, 146, 60, 0.4)' :
                '0 8px 24px rgba(0, 0, 0, 0.2)'
            };
        }
    }
`;

const CardContent = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    position: relative;

    @media (max-width: 768px) {
        padding: 18px 14px;
        gap: 12px;
    }
`;

const WalkDetails = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
`;

const TopRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-right: 32px; /* Space for completed/cancelled badge */
`;

const PetName = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    cursor: pointer;
    transition: color 0.2s ease;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;

    &:hover {
        color: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 768px) {
        font-size: 1.1rem;
    }
`;

const WalkTime = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    white-space: nowrap;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

const Address = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;

    svg {
        flex-shrink: 0;
        margin-top: 2px;
    }

    @media (max-width: 768px) {
        font-size: 0.8rem;
    }
`;

const WalkInfo = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const InfoItem = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.75rem;
    font-weight: 600;

    @media (max-width: 768px) {
        font-size: 0.78rem;
    }
`;

const InfoDivider = styled.span`
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-weight: 700;
`;


// Earnings Display
const EarningsDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding: 6px 10px;
    background: rgba(6, 182, 212, 0.3);
    border-radius: 8px;
    border: 2px solid rgba(6, 182, 212, 0.6);
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);

    @media (max-width: 768px) {
        padding: 5px 8px;
    }
`;

const EarningsAmount = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 800;
    color: #22d3ee;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

// Action Buttons
const ActionButtons = styled.div`
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;

    @media (max-width: 768px) {
        gap: 8px;
    }
`;

const ShareButton = styled.button`
    background: rgba(102, 126, 234, 0.35);
    border: 2px solid rgba(102, 126, 234, 0.7);
    color: #8b9eff;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

    &:active {
        transform: scale(0.95);
    }

    @media (min-width: 769px) {
        &:hover {
            background: rgba(102, 126, 234, 0.5);
            border-color: rgba(102, 126, 234, 0.9);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 12px;
    }
`;

const CompleteButton = styled.button`
    background: rgba(6, 182, 212, 0.35);
    border: 2px solid rgba(6, 182, 212, 0.7);
    color: #22d3ee;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);

    &:active {
        transform: scale(0.95);
    }

    @media (min-width: 769px) {
        &:hover {
            background: rgba(6, 182, 212, 0.5);
            border-color: rgba(6, 182, 212, 0.9);
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 12px;
    }
`;

const CancelButton = styled.button`
    background: rgba(251, 146, 60, 0.35);
    border: 2px solid rgba(251, 146, 60, 0.7);
    color: #fbbf24;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);

    &:active {
        transform: scale(0.95);
    }

    @media (min-width: 769px) {
        &:hover {
            background: rgba(251, 146, 60, 0.5);
            border-color: rgba(251, 146, 60, 0.9);
            box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
        }
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        border-radius: 12px;
    }
`;

// Status Badges
const DelegatedBadge = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(102, 126, 234, 0.35);
    border: 2px solid rgba(102, 126, 234, 0.7);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8b9eff;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);

    @media (max-width: 768px) {
        font-size: 10px;
        padding: 3px 6px;
    }
`;

const CoveringBadge = styled.div`
    margin-top: 8px;
    padding: 6px 10px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25));
    border: 2px solid rgba(16, 185, 129, 0.6);
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #10b981;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    width: fit-content;

    svg {
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        font-size: 11px;
        padding: 5px 8px;
    }
`;

const CoveredByBadge = styled.div`
    margin-top: 8px;
    padding: 6px 10px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25));
    border: 2px solid rgba(99, 102, 241, 0.6);
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6366f1;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    width: fit-content;

    svg {
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        font-size: 11px;
        padding: 5px 8px;
    }
`;

const CompletedBadge = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    background: rgba(6, 182, 212, 0.35);
    border: 2px solid rgba(6, 182, 212, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22d3ee;
    box-shadow: 0 2px 6px rgba(6, 182, 212, 0.3);
    z-index: 5;

    @media (max-width: 768px) {
        width: 26px;
        height: 26px;
        top: 10px;
        right: 10px;
    }
`;

const CancelledBadge = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    background: rgba(251, 146, 60, 0.35);
    border: 2px solid rgba(251, 146, 60, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
    box-shadow: 0 2px 6px rgba(251, 146, 60, 0.3);
    z-index: 5;

    @media (max-width: 768px) {
        width: 26px;
        height: 26px;
        top: 10px;
        right: 10px;
    }
`;

// Daily Total Card
const DailyTotalCard = styled.div`
    width: 100%;
    max-width: 448px;
    margin-top: 0;
    padding: 20px 12px;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(20px);
    border-radius: 0;
    border: none;
    border-top: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: none;
    text-align: center;

    @media (min-width: 768px) {
        padding: 20px;
        margin-top: 20px;
        border-radius: 16px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
`;

const DailyTotalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;

    @media (max-width: 768px) {
        font-size: 0.9rem;
    }
`;

const DailyTotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #22d3ee;
    margin-bottom: 8px;
    text-shadow: 0 2px 12px rgba(6, 182, 212, 0.5);

    @media (max-width: 768px) {
        font-size: 2rem;
    }
`;

const DailyTotalSub = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;

    @media (max-width: 768px) {
        font-size: 0.85rem;
    }
`;

// Completion Modal Styled Components
const CompletionModalOverlay = styled.div`
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
    z-index: 10002;
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

const CompletionModalContainer = styled.div`
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    width: 100%;
    max-width: 500px;
    max-height: 95vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
    border-radius: 24px 24px 0 0;

    @media (min-width: 768px) {
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

    /* Custom scrollbar */
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

const CompletionModalDragHandle = styled.div`
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;

    @media (min-width: 768px) {
        display: none;
    }
`;

const CompletionModalHeader = styled.div`
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CompletionModalHeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

const CompletionModalTitle = styled.h2`
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

const CompletionModalCloseButton = styled.button`
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

const PetInfoBanner = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const PetNameLarge = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.02em;

    @media (max-width: 767px) {
        font-size: 1.3rem;
    }
`;

const WalkMetadata = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const WalkTypeChip = styled.div`
    background: ${({ $solo }) =>
        $solo ? 'rgba(165, 105, 167, 0.25)' : 'rgba(102, 126, 234, 0.25)'
    };
    border: 1px solid ${({ $solo }) =>
        $solo ? 'rgba(165, 105, 167, 0.4)' : 'rgba(102, 126, 234, 0.4)'
    };
    color: ${({ $solo }) => $solo ? '#d8b4d8' : '#b0c4ff'};
    padding: 4px 10px;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const WalkTimeText = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;

    @media (max-width: 767px) {
        font-size: 0.8rem;
    }
`;

const CompletionModalContent = styled.div`
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    @media (max-width: 767px) {
        padding: 20px 16px 24px;
        gap: 16px;
    }
`;

const CompensationCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
`;

const CompensationCardTitle = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
`;

const CompensationBreakdown = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const CompensationItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CompensationItemLabel = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
`;

const CompensationItemValue = styled.span`
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: ${({ $accent }) => $accent ? '#d8b4d8' : '#ffffff'};
`;

const DurationSection = styled.div``;

const SectionLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
`;

const DurationSelector = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
`;

const DurationOption = styled.button`
    background: ${({ $active }) =>
        $active ? 'linear-gradient(135deg, #8b5a8c, #a569a7)' : 'rgba(255, 255, 255, 0.08)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? '#a569a7' : 'rgba(255, 255, 255, 0.12)'
    };
    border-radius: 14px;
    padding: 16px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 68px;

    &:hover:not(:disabled) {
        background: ${({ $active }) =>
            $active ? 'linear-gradient(135deg, #7d527e, #936394)' : 'rgba(255, 255, 255, 0.12)'
        };
        border-color: ${({ $active }) => $active ? '#936394' : 'rgba(255, 255, 255, 0.2)'};
        transform: scale(1.02);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 14px 10px;
        min-height: 64px;
    }
`;

const DurationTime = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;

    @media (max-width: 767px) {
        font-size: 1.3rem;
    }
`;

const DurationUnit = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
`;

const AdjustmentSection = styled.div``;

const SplitSection = styled.div`
    margin: 16px 0;
`;

const SplitInfo = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 12px;
`;

const SplitSliderContainer = styled.div`
    padding: 16px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    margin-bottom: 12px;
`;

const SplitSlider = styled.input`
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    margin-bottom: 12px;
    cursor: pointer;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #667eea;
        cursor: pointer;
        border-radius: 50%;
        border: 3px solid white;
    }

    &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #667eea;
        cursor: pointer;
        border-radius: 50%;
        border: 3px solid white;
    }
`;

const SplitLabels = styled.div`
    display: flex;
    justify-content: space-between;
`;

const SplitLabel = styled.div`
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    font-weight: 600;
`;

const SplitBreakdown = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
`;

const SplitItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;

    &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
`;

const SplitItemLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
`;

const SplitItemValue = styled.div`
    color: #ffffff;
    font-weight: 600;
    font-size: 0.95rem;
`;

const AdjustmentTypeToggle = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
`;

const AdjustmentTypeButton = styled.button`
    background: ${({ $active }) =>
        $active ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
    };
    border: 2px solid ${({ $active }) =>
        $active ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
    };
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${({ $active }) => $active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 767px) {
        padding: 10px 14px;
        font-size: 0.85rem;
    }
`;

const AdjustmentInput = styled.div`
    position: relative;
    display: flex;
    align-items: center;

    svg {
        position: absolute;
        left: 16px;
        color: rgba(255, 255, 255, 0.6);
        z-index: 1;
    }

    input {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 14px 16px 14px 48px;
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
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
    }
`;

const TotalCard = styled.div`
    background: ${({ $positive }) =>
        $positive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(251, 146, 60, 0.2)'
    };
    border: 2px solid ${({ $positive }) =>
        $positive ? 'rgba(6, 182, 212, 0.4)' : 'rgba(251, 146, 60, 0.4)'
    };
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    @media (max-width: 767px) {
        padding: 16px;
    }
`;

const TotalLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.8px;
`;

const TotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;

    @media (max-width: 767px) {
        font-size: 2rem;
    }
`;

const ModalActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
`;

const ConfirmButton = styled.button`
    background: linear-gradient(135deg, #06b6d4, #0891b2);
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
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
    letter-spacing: -0.01em;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0891b2, #0e7490);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(6, 182, 212, 0.5);
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

const CancelActionButton = styled.button`
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

// Cancel Modal Styled Components
const CancelModalOverlay = styled.div`
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
    z-index: 10002;
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

const CancelModalContainer = styled.div`
    background: linear-gradient(145deg, #2D1B2E 0%, #4A2C4B 100%);
    width: 100%;
    max-width: 480px;
    max-height: 95vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.5);
    border-radius: 24px 24px 0 0;

    @media (min-width: 768px) {
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

const CancelModalDragHandle = styled.div`
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;

    @media (min-width: 768px) {
        display: none;
    }
`;

const CancelModalHeader = styled.div`
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelModalHeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

const CancelModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fb923c;
    margin: 0;
    letter-spacing: -0.01em;

    @media (max-width: 767px) {
        font-size: 1.1rem;
    }
`;

const CancelModalCloseButton = styled.button`
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

const CancelModalContent = styled.div`
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    @media (max-width: 767px) {
        padding: 20px 16px 24px;
        gap: 16px;
    }
`;

const CancellationInfoCard = styled.div`
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.3);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;

    @media (max-width: 767px) {
        padding: 16px;
        gap: 12px;
    }
`;

const CancellationWarning = styled.div`
    width: 44px;
    height: 44px;
    background: rgba(251, 146, 60, 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fb923c;

    @media (max-width: 767px) {
        width: 40px;
        height: 40px;
    }
`;

const CancellationMessage = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 8px 0 0;
    line-height: 1.5;
    font-weight: 500;

    @media (max-width: 767px) {
        font-size: 0.9rem;
    }
`;

const CancellationFeeSection = styled.div``;

const FeeInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    svg {
        position: absolute;
        left: 16px;
        color: rgba(255, 255, 255, 0.6);
        z-index: 1;
    }

    input {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 14px 16px 14px 50px;
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
        transition: all 0.2s ease;

        &::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
            outline: none;
            border-color: rgba(251, 146, 60, 0.6);
            background: rgba(255, 255, 255, 0.12);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        &[type=number] {
            -moz-appearance: textfield;
        }
    }
`;

const FeeHint = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.4;

    @media (max-width: 767px) {
        font-size: 0.8rem;
    }
`;

const CancelModalActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
`;

const CancelWalkButton = styled.button`
    background: linear-gradient(135deg, #fb923c, #f97316);
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
    box-shadow: 0 8px 24px rgba(251, 146, 60, 0.4);
    letter-spacing: -0.01em;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #f97316, #ea580c);
        transform: translateY(-1px);
        box-shadow: 0 10px 28px rgba(251, 146, 60, 0.5);
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

const KeepWalkButton = styled.button`
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

// Pet Details Modal Styled Components
const PetModalOverlay = styled.div`
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

const PetModalContainer = styled.div`
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

const PetModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 20px;
`;

const PetModalTitle = styled.h2`
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

const PetModalCloseButton = styled.button`
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

const PetModalContent = styled.div`
    padding: 0 24px 24px;
`;

const PetMainInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const PetModalAvatar = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const PetNameContainer = styled.div`
    flex: 1;
`;

const PetModalName = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PetBreed = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-weight: 500;
    font-style: italic;
`;

const PetDetailsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
`;

const PetDetailItem = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
    }
`;

const DetailIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(165, 105, 167, 0.3);
    border-radius: 50%;
    color: #ffffff;
    flex-shrink: 0;
`;

const DetailContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const DetailLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
`;

const DetailValue = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #ffffff;
    word-break: break-word;
`;

const NotesSection = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 16px;
    
    &:last-child {
        margin-bottom: 0;
    }
`;

const NotesTitle = styled.h4`
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const NotesText = styled.p`
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.6;
    font-weight: 400;
`;

// Header Button Group
const HeaderButtonGroup = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    margin-right: 16px;
`;

// Header Button - Rounded Icon Button
const HeaderButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);

    /* Holographic shimmer effect */
    &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
        );
        transform: rotate(45deg);
        animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
        }
    }

    &:active {
        transform: scale(0.95);
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
        );
    }

    @media (min-width: 768px) {
        width: 44px;
        height: 44px;

        svg {
            width: 20px;
            height: 20px;
        }

        &:hover {
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.25),
                rgba(255, 255, 255, 0.1)
            );
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-2px);
            box-shadow:
                0 6px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
    }
`;