import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Users, MapPin, Clock, TrendingDown, ChevronRight, Sparkles, X, Check } from 'lucide-react';

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
                            <IconButton
                                $delete
                                onClick={() => handleDeleteGroup(group.id)}
                                title="Ungroup"
                            >
                                <X size={16} />
                            </IconButton>

                            <GroupHeader>
                                <GroupTitle>
                                    <Users size={14} />
                                    {group.name}
                                </GroupTitle>
                                <GroupSize $accepted>{group.appointments?.length || 0}</GroupSize>
                            </GroupHeader>

                            <PetList>
                                {group.appointments?.map((appt, apptIdx) => (
                                    <PetItem key={`accepted-${group.id}-appt-${appt.id}-${apptIdx}`}>
                                        <PetDot $accepted />
                                        <PetName>{appt.pet?.name}</PetName>
                                    </PetItem>
                                ))}
                            </PetList>
                        </GroupCard>
                    ))}
                </GroupsContainer>
            )}

            {filteredSuggestions.length > 0 && (
                <GroupsContainer>
                    {acceptedGroups.length > 0 && <SectionTitle>Suggestions</SectionTitle>}
                    {filteredSuggestions.map((group, idx) => (
                        <GroupCard key={idx}>
                            <IconButton
                                $accept
                                onClick={() => handleAcceptGroup(group)}
                                disabled={processingGroupId === group.appointments[0]}
                                title="Accept Group"
                            >
                                {processingGroupId === group.appointments[0] ? (
                                    <Clock size={16} />
                                ) : (
                                    <Check size={16} />
                                )}
                            </IconButton>

                            <GroupHeader>
                                <GroupTitle>
                                    <Users size={14} />
                                    Group {idx + 1}
                                </GroupTitle>
                                <GroupSize>{group.group_size}</GroupSize>
                            </GroupHeader>

                            <PetList>
                                {group.pets.map((pet, petIdx) => (
                                    <PetItem key={`suggestion-${idx}-pet-${pet.id}-${petIdx}`}>
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
    margin-bottom: 0;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border-radius: 0;
    border: none;
    border-top: 2px solid rgba(255, 255, 255, 0.35);
    border-bottom: 2px solid rgba(255, 255, 255, 0.35);
    box-shadow: none;
    padding: 16px;

    @media (min-width: 768px) {
        padding: 16px;
        margin-bottom: 14px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    @media (min-width: 768px) {
        font-size: 1rem;
    }
`;

const HeaderSubtitle = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.7rem;
    margin: 0;
    font-weight: 700;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const LoadingText = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.9rem;
    text-align: center;
    margin: 20px 0;
`;

const ErrorText = styled.p`
    font-family: 'Poppins', sans-serif;
    color: rgba(251, 146, 60, 0.95);
    font-size: 0.9rem;
    text-align: center;
    margin: 20px 0;
`;

const GroupsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-top: 12px;
    margin-top: 12px;
    border-top: 2px solid rgba(255, 255, 255, 0.3);

    &:first-child {
        border-top: none;
        padding-top: 0;
        margin-top: 0;
    }

    @media (min-width: 768px) {
        gap: 8px;
    }
`;

const SectionTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 1);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 0 0;
    padding-bottom: 10px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

    @media (min-width: 768px) {
        margin: 0 0 8px 2px;
        padding-bottom: 0;
    }
`;

const GroupCard = styled.div`
    background: ${({ $accepted }) =>
        $accepted ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.12)'
    };
    border: none;
    border-bottom: 2px solid ${({ $accepted }) =>
        $accepted ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    };
    border-radius: 0;
    padding: 14px 8px;
    transition: all 0.2s ease;
    position: relative;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: ${({ $accepted }) =>
            $accepted ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.16)'
        };
    }

    @media (min-width: 768px) {
        border: 2px solid ${({ $accepted }) =>
            $accepted ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.3)'
        };
        border-radius: 10px;
        padding: 14px;

        &:last-child {
            border: 2px solid ${({ $accepted }) =>
                $accepted ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.3)'
            };
        }

        &:hover {
            background: ${({ $accepted }) =>
                $accepted ? 'rgba(6, 182, 212, 0.28)' : 'rgba(255, 255, 255, 0.18)'
            };
            border-color: ${({ $accepted }) =>
                $accepted ? 'rgba(6, 182, 212, 0.7)' : 'rgba(255, 255, 255, 0.4)'
            };
        }
    }
`;

const GroupHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-right: 40px; /* Space for accept/delete button */
`;

const GroupTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const GroupSize = styled.span`
    font-family: 'Poppins', sans-serif;
    background: ${({ $accepted }) =>
        $accepted ? 'rgba(6, 182, 212, 0.35)' : 'rgba(102, 126, 234, 0.35)'
    };
    border: 2px solid ${({ $accepted }) =>
        $accepted ? 'rgba(6, 182, 212, 0.7)' : 'rgba(102, 126, 234, 0.7)'
    };
    color: #ffffff;
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 6px ${({ $accepted }) =>
        $accepted ? 'rgba(6, 182, 212, 0.3)' : 'rgba(102, 126, 234, 0.3)'
    };
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
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-size: 0.8rem;
`;

const PetDot = styled.div`
    width: 7px;
    height: 7px;
    background: ${({ $accepted }) => $accepted ? '#22d3ee' : '#fbbf24'};
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 6px ${({ $accepted }) => $accepted ? '#22d3ee' : '#fbbf24'};
`;

const PetName = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 1);
    font-size: 0.8rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
    padding: 7px 11px;
    background: ${({ $highlight }) =>
        $highlight ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.15)'
    };
    border: 2px solid ${({ $highlight }) =>
        $highlight ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.3)'
    };
    border-radius: 6px;
    flex: 1;
`;

const StatIcon = styled.div`
    color: rgba(255, 255, 255, 0.9);
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
    font-weight: 700;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const IconButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: ${({ $accept, $delete }) =>
        $accept ? 'rgba(6, 182, 212, 0.35)' :
        $delete ? 'rgba(251, 146, 60, 0.35)' :
        'rgba(102, 126, 234, 0.35)'
    };
    border: 2px solid ${({ $accept, $delete }) =>
        $accept ? 'rgba(6, 182, 212, 0.7)' :
        $delete ? 'rgba(251, 146, 60, 0.7)' :
        'rgba(102, 126, 234, 0.7)'
    };
    color: ${({ $accept, $delete }) =>
        $accept ? '#22d3ee' :
        $delete ? '#fbbf24' :
        '#8b9eff'
    };
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 8px ${({ $accept, $delete }) =>
        $accept ? 'rgba(6, 182, 212, 0.3)' :
        $delete ? 'rgba(251, 146, 60, 0.3)' :
        'rgba(102, 126, 234, 0.3)'
    };
    z-index: 5;

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    @media (min-width: 769px) {
        width: 34px;
        height: 34px;

        &:hover:not(:disabled) {
            background: ${({ $accept, $delete }) =>
                $accept ? 'rgba(6, 182, 212, 0.5)' :
                $delete ? 'rgba(251, 146, 60, 0.5)' :
                'rgba(102, 126, 234, 0.5)'
            };
            border-color: ${({ $accept, $delete }) =>
                $accept ? 'rgba(6, 182, 212, 0.9)' :
                $delete ? 'rgba(251, 146, 60, 0.9)' :
                'rgba(102, 126, 234, 0.9)'
            };
            box-shadow: 0 4px 12px ${({ $accept, $delete }) =>
                $accept ? 'rgba(6, 182, 212, 0.4)' :
                $delete ? 'rgba(251, 146, 60, 0.4)' :
                'rgba(102, 126, 234, 0.4)'
            };
        }
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
