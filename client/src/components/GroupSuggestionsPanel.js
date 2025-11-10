import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Users, MapPin, Clock, TrendingDown, ChevronRight, Sparkles } from 'lucide-react';

export default function GroupSuggestionsPanel({ date, appointments, onGroupChange }) {
    const [suggestions, setSuggestions] = useState([]);
    const [acceptedGroups, setAcceptedGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingGroupId, setProcessingGroupId] = useState(null);

    useEffect(() => {
        if (appointments && appointments.length > 0) {
            fetchGroupSuggestions();
            fetchAcceptedGroups();
        } else {
            setLoading(false);
        }
    }, [date, appointments]);

    const fetchGroupSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");
            const dateParam = date || new Date().toISOString().split('T')[0];
            const response = await fetch(`/walk_groups/suggestions?date=${dateParam}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch group suggestions');
            }

            const data = await response.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            console.error('Error fetching group suggestions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAcceptedGroups = async () => {
        try {
            const token = localStorage.getItem("token");
            const dateParam = date || new Date().toISOString().split('T')[0];
            const response = await fetch(`/walk_groups?date=${dateParam}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAcceptedGroups(data || []);
            }
        } catch (err) {
            console.error('Error fetching accepted groups:', err);
        }
    };

    const handleAcceptGroup = async (group) => {
        try {
            setProcessingGroupId(group.appointments[0]);

            const token = localStorage.getItem("token");
            const dateParam = date || new Date().toISOString().split('T')[0];

            const response = await fetch('/walk_groups', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointment_ids: group.appointments,
                    name: `Group of ${group.group_size}`,
                    date: dateParam
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create group');
            }

            const data = await response.json();

            // Refresh accepted groups and suggestions
            await fetchAcceptedGroups();
            await fetchGroupSuggestions();

            // Notify parent component to refresh appointments
            if (onGroupChange) {
                onGroupChange();
            }
        } catch (err) {
            console.error('Error accepting group:', err);
            alert(`Failed to create group: ${err.message}`);
        } finally {
            setProcessingGroupId(null);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`/walk_groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete group');
            }

            // Refresh accepted groups and suggestions
            await fetchAcceptedGroups();
            await fetchGroupSuggestions();

            // Notify parent component to refresh appointments
            if (onGroupChange) {
                onGroupChange();
            }
        } catch (err) {
            console.error('Error deleting group:', err);
            alert(`Failed to delete group: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <Panel>
                <PanelHeader>
                    <HeaderIcon>
                        <Sparkles size={20} />
                    </HeaderIcon>
                    <HeaderTitle>Smart Grouping</HeaderTitle>
                </PanelHeader>
                <LoadingText>Analyzing walks...</LoadingText>
            </Panel>
        );
    }

    if (error) {
        return (
            <Panel>
                <PanelHeader>
                    <HeaderIcon>
                        <Sparkles size={20} />
                    </HeaderIcon>
                    <HeaderTitle>Smart Grouping</HeaderTitle>
                </PanelHeader>
                <ErrorText>Unable to load suggestions</ErrorText>
            </Panel>
        );
    }

    // Filter out suggestions that have already been accepted
    const filteredSuggestions = suggestions.filter(suggestion => {
        // Check if all appointments in this suggestion are already grouped
        const allGrouped = suggestion.appointments.every(apptId =>
            acceptedGroups.some(group =>
                group.appointments?.some(appt => appt.id === apptId)
            )
        );
        return !allGrouped;
    });

    if (!filteredSuggestions || filteredSuggestions.length === 0) {
        if (acceptedGroups.length === 0) {
            return null; // Don't show panel if no suggestions and no accepted groups
        }
    }

    return (
        <Panel>
            <PanelHeader>
                <HeaderLeft>
                    <HeaderIcon>
                        <Sparkles size={16} />
                    </HeaderIcon>
                    <HeaderTitle>Smart Grouping</HeaderTitle>
                </HeaderLeft>
                <HeaderSubtitle>
                    {acceptedGroups.length > 0 && `${acceptedGroups.length} active`}
                    {acceptedGroups.length > 0 && filteredSuggestions.length > 0 && ' • '}
                    {filteredSuggestions.length > 0 && `${filteredSuggestions.length} new`}
                </HeaderSubtitle>
            </PanelHeader>

            {acceptedGroups.length > 0 && (
                <GroupsContainer>
                    <SectionTitle>Active Groups</SectionTitle>
                    {acceptedGroups.map((group) => (
                        <GroupCard key={group.id} $accepted>
                            <GroupHeader>
                                <GroupTitle>
                                    <Users size={14} />
                                    {group.name}
                                </GroupTitle>
                                <GroupSize $accepted>{group.appointments?.length || 0}</GroupSize>
                            </GroupHeader>

                            <PetList>
                                {group.appointments?.map((appt) => (
                                    <PetItem key={appt.id}>
                                        <PetDot $accepted />
                                        <PetName>{appt.pet?.name}</PetName>
                                    </PetItem>
                                ))}
                            </PetList>

                            <DeleteButton onClick={() => handleDeleteGroup(group.id)}>
                                Ungroup
                            </DeleteButton>
                        </GroupCard>
                    ))}
                </GroupsContainer>
            )}

            {filteredSuggestions.length > 0 && (
                <GroupsContainer>
                    {acceptedGroups.length > 0 && <SectionTitle>Suggestions</SectionTitle>}
                    {filteredSuggestions.map((group, idx) => (
                        <GroupCard key={idx}>
                            <GroupHeader>
                                <GroupTitle>
                                    <Users size={14} />
                                    Group {idx + 1}
                                </GroupTitle>
                                <GroupSize>{group.group_size}</GroupSize>
                            </GroupHeader>

                            <PetList>
                                {group.pets.map((pet, petIdx) => (
                                    <PetItem key={pet.id}>
                                        <PetDot />
                                        <PetName>{pet.name}</PetName>
                                    </PetItem>
                                ))}
                            </PetList>

                            <StatsGrid>
                                <StatItem>
                                    <StatIcon>
                                        <MapPin size={12} />
                                    </StatIcon>
                                    <StatValue>{group.total_distance} mi</StatValue>
                                </StatItem>
                                <StatItem>
                                    <StatIcon>
                                        <Clock size={12} />
                                    </StatIcon>
                                    <StatValue>{group.estimated_time} min</StatValue>
                                </StatItem>
                                {group.estimated_savings > 0 && (
                                    <StatItem $highlight>
                                        <StatIcon>
                                            <TrendingDown size={12} />
                                        </StatIcon>
                                        <StatValue>-{group.estimated_savings} min</StatValue>
                                    </StatItem>
                                )}
                            </StatsGrid>

                            <AcceptButton
                                onClick={() => handleAcceptGroup(group)}
                                disabled={processingGroupId === group.appointments[0]}
                            >
                                <span>{processingGroupId === group.appointments[0] ? 'Creating...' : 'Accept Group'}</span>
                                <ChevronRight size={18} />
                            </AcceptButton>
                        </GroupCard>
                    ))}
                </GroupsContainer>
            )}
        </Panel>
    );
}

const Panel = styled.div`
    width: 100%;
    max-width: 448px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 12px;

    @media (min-width: 768px) {
        padding: 14px;
        margin-bottom: 14px;
    }
`;

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const HeaderIcon = styled.div`
    color: #fbbf24;
    display: flex;
    align-items: center;
`;

const HeaderTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;

    @media (min-width: 768px) {
        font-size: 1rem;
    }
`;

const HeaderSubtitle = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    margin: 0;
    font-weight: 500;
    white-space: nowrap;
`;

const LoadingText = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    text-align: center;
    margin: 20px 0;
`;

const ErrorText = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(239, 68, 68, 0.9);
    font-size: 0.9rem;
    text-align: center;
    margin: 20px 0;
`;

const GroupsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const SectionTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 6px 2px;
`;

const GroupCard = styled.div`
    background: ${({ $accepted }) =>
        $accepted ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.06)'
    };
    border: 1px solid ${({ $accepted }) =>
        $accepted ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.12)'
    };
    border-radius: 10px;
    padding: 10px;
    transition: all 0.2s ease;

    &:hover {
        background: ${({ $accepted }) =>
            $accepted ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.1)'
        };
        border-color: ${({ $accepted }) =>
            $accepted ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.2)'
        };
    }

    @media (min-width: 768px) {
        padding: 12px;
    }
`;

const GroupHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const GroupTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 5px;
`;

const GroupSize = styled.span`
    font-family: 'Poppins', sans-serif;
    background: ${({ $accepted }) =>
        $accepted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(102, 126, 234, 0.2)'
    };
    border: 1px solid ${({ $accepted }) =>
        $accepted ? 'rgba(34, 197, 94, 0.35)' : 'rgba(102, 126, 234, 0.35)'
    };
    color: #ffffff;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
`;

const PetList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
`;

const PetItem = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    font-size: 0.8rem;
`;

const PetDot = styled.div`
    width: 5px;
    height: 5px;
    background: ${({ $accepted }) => $accepted ? '#22c55e' : '#fbbf24'};
    border-radius: 50%;
    flex-shrink: 0;
`;

const PetName = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    font-weight: 500;
`;

const StatsGrid = styled.div`
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
`;

const StatItem = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    background: ${({ $highlight }) =>
        $highlight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)'
    };
    border: 1px solid ${({ $highlight }) =>
        $highlight ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.08)'
    };
    border-radius: 6px;
    flex: 1;
`;

const StatIcon = styled.div`
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    line-height: 1;
`;

const StatLabel = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    display: none;

    @media (min-width: 768px) {
        display: inline;
    }
`;

const StatValue = styled.span`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
`;

const AcceptButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.25));
        border-color: rgba(102, 126, 234, 0.5);
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    svg {
        width: 14px;
        height: 14px;
    }
`;

const DeleteButton = styled.button`
    width: 100%;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: rgba(239, 68, 68, 0.5);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;
