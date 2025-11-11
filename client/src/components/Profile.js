import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import { UserContext } from "../context/user";
import YearlyFinanceOverview from "./YearlyFinanceOverview";
import dogPlaceholder from "../assets/dog.png";
import {
    DollarSign,
    Settings,
    Trophy,
    Zap,
    User as UserIcon,
    Edit2,
    Check,
    X,
    Mail,
    AtSign,
    Camera,
    Upload
} from "lucide-react";

const calculateTrainingHours = (invoices) => {
    if (!invoices) return { totalMinutes: 0, totalHours: 0 };

    // Filter for training walks and sum up their durations
    const trainingInvoices = invoices.filter(invoice =>
        invoice.title && invoice.title.toLowerCase().includes('training')
    );

    // Extract minutes from title (e.g., "30 min training walk" -> 30)
    const totalMinutes = trainingInvoices.reduce((sum, invoice) => {
        const match = invoice.title.match(/(\d+)\s*min/);
        if (match) {
            return sum + parseInt(match[1], 10);
        }
        return sum;
    }, 0);

    const totalHours = totalMinutes / 60;

    return { totalMinutes, totalHours };
};

export default function Profile() {
    const { user, setUser } = useContext(UserContext);
    const [isUpdatingRates, setIsUpdatingRates] = useState(false);
    const [rates, setRates] = useState({
        thirty: user?.thirty || "",
        fortyfive: user?.fortyfive || "",
        sixty: user?.sixty || "",
        solo_rate: user?.solo_rate || "",
        training_rate: user?.training_rate || "",
        sibling_rate: user?.sibling_rate || "",
    });

    // Profile editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || "");
    const [editedUsername, setEditedUsername] = useState(user?.username || "");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        setEditedName(user?.name || "");
        setEditedUsername(user?.username || "");
        setPhotoError(false); // Reset photo error when user changes
    }, [user]);

    // Calculate training hours for certification
    const { totalHours } = calculateTrainingHours(user?.invoices);
    const goalHours = 300;
    const progressPercent = Math.min((totalHours / goalHours) * 100, 100);
    const hoursRemaining = Math.max(goalHours - totalHours, 0);

    const handleRateChange = (e) => {
        setRates({
            ...rates,
            [e.target.name]: e.target.value
        });
    };

    const handleRateUpdate = async (e) => {
        e.preventDefault();
        setIsUpdatingRates(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(rates),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUserData = await response.json();
                // Smart update - only update rate fields, not entire user object
                setUser(prevUser => ({
                    ...prevUser,
                    thirty: updatedUserData.thirty,
                    fortyfive: updatedUserData.fortyfive,
                    sixty: updatedUserData.sixty,
                    solo_rate: updatedUserData.solo_rate,
                    training_rate: updatedUserData.training_rate,
                    sibling_rate: updatedUserData.sibling_rate
                }));
                toast.success("Rates updated successfully!");
            } else {
                toast.error("Failed to update rates");
            }
        } catch (error) {
            console.error("Error updating rates:", error);
            toast.error("An error occurred while updating rates");
        } finally {
            setIsUpdatingRates(false);
        }
    };

    const handleNameUpdate = async () => {
        if (!editedName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        if (editedName === user?.name) {
            setIsEditingName(false);
            return;
        }

        setIsUpdatingProfile(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/update_profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: editedName }),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUserData = await response.json();
                setUser(prevUser => ({
                    ...prevUser,
                    name: updatedUserData.name
                }));
                toast.success("Name updated successfully!");
                setIsEditingName(false);
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to update name");
            }
        } catch (error) {
            console.error("Error updating name:", error);
            toast.error("An error occurred while updating name");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUsernameUpdate = async () => {
        if (!editedUsername.trim()) {
            setUsernameError("Username cannot be empty");
            return;
        }

        if (editedUsername === user?.username) {
            setIsEditingUsername(false);
            setUsernameError("");
            return;
        }

        setIsUpdatingProfile(true);
        setUsernameError("");

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/update_profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ username: editedUsername }),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUserData = await response.json();
                setUser(prevUser => ({
                    ...prevUser,
                    username: updatedUserData.username
                }));
                toast.success("Username updated successfully!");
                setIsEditingUsername(false);
                setUsernameError("");
            } else {
                const errorData = await response.json();
                setUsernameError(errorData.error || "Failed to update username");
                toast.error(errorData.error || "Failed to update username");
            }
        } catch (error) {
            console.error("Error updating username:", error);
            setUsernameError("An error occurred while updating username");
            toast.error("An error occurred while updating username");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const cancelNameEdit = () => {
        setEditedName(user?.name || "");
        setIsEditingName(false);
    };

    const cancelUsernameEdit = () => {
        setEditedUsername(user?.username || "");
        setIsEditingUsername(false);
        setUsernameError("");
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setIsUploadingPhoto(true);

        try {
            const formData = new FormData();
            formData.append('profile_pic', file);

            const token = localStorage.getItem("token");
            const response = await fetch("/update_profile", {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
                credentials: "include"
            });

            if (response.ok) {
                const updatedUserData = await response.json();
                setUser(updatedUserData);
                toast.success("Profile photo updated successfully!");
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to upload photo");
            }
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error("An error occurred while uploading photo");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    return (
        <Container>
            <ProfileHeader>
                <ProfilePhotoWrapper>
                    {user?.profile_pic_url && !photoError ? (
                        <ProfilePhoto
                            src={user.profile_pic_url}
                            alt={user.name}
                            onError={() => setPhotoError(true)}
                        />
                    ) : (
                        <ProfilePhoto
                            src={dogPlaceholder}
                            alt="Profile placeholder"
                        />
                    )}
                    <PhotoUploadOverlay>
                        <PhotoUploadLabel htmlFor="profile-photo-upload">
                            {isUploadingPhoto ? (
                                <Upload size={20} className="uploading" />
                            ) : (
                                <Camera size={20} />
                            )}
                        </PhotoUploadLabel>
                        <PhotoUploadInput
                            id="profile-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                        />
                    </PhotoUploadOverlay>
                </ProfilePhotoWrapper>
                <ProfileHeaderText>
                    <ProfileTitle>{user?.name}'s Profile</ProfileTitle>
                    <ProfileSubtitle>Manage your account settings</ProfileSubtitle>
                </ProfileHeaderText>
            </ProfileHeader>

            <ProfileInfoCard>
                <InfoSection>
                    <InfoLabel>
                        <Mail size={16} />
                        Email Address
                    </InfoLabel>
                    <InfoValue>{user?.email}</InfoValue>
                </InfoSection>

                <InfoSection>
                    <InfoLabel>
                        <UserIcon size={16} />
                        Full Name
                    </InfoLabel>
                    {isEditingName ? (
                        <EditContainer>
                            <EditInput
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                placeholder="Enter your name"
                                disabled={isUpdatingProfile}
                            />
                            <EditActions>
                                <EditButton
                                    onClick={handleNameUpdate}
                                    disabled={isUpdatingProfile}
                                    $primary
                                >
                                    <Check size={16} />
                                </EditButton>
                                <EditButton
                                    onClick={cancelNameEdit}
                                    disabled={isUpdatingProfile}
                                >
                                    <X size={16} />
                                </EditButton>
                            </EditActions>
                        </EditContainer>
                    ) : (
                        <InfoValueRow>
                            <InfoValue>{user?.name}</InfoValue>
                            <EditIconButton onClick={() => setIsEditingName(true)}>
                                <Edit2 size={16} />
                            </EditIconButton>
                        </InfoValueRow>
                    )}
                </InfoSection>

                <InfoSection>
                    <InfoLabel>
                        <AtSign size={16} />
                        Username
                    </InfoLabel>
                    {isEditingUsername ? (
                        <EditContainer>
                            <EditInput
                                type="text"
                                value={editedUsername}
                                onChange={(e) => {
                                    setEditedUsername(e.target.value);
                                    setUsernameError("");
                                }}
                                placeholder="Enter username"
                                disabled={isUpdatingProfile}
                                $hasError={!!usernameError}
                            />
                            <EditActions>
                                <EditButton
                                    onClick={handleUsernameUpdate}
                                    disabled={isUpdatingProfile}
                                    $primary
                                >
                                    <Check size={16} />
                                </EditButton>
                                <EditButton
                                    onClick={cancelUsernameEdit}
                                    disabled={isUpdatingProfile}
                                >
                                    <X size={16} />
                                </EditButton>
                            </EditActions>
                            {usernameError && <ErrorText>{usernameError}</ErrorText>}
                        </EditContainer>
                    ) : (
                        <InfoValueRow>
                            <InfoValue>@{user?.username}</InfoValue>
                            <EditIconButton onClick={() => setIsEditingUsername(true)}>
                                <Edit2 size={16} />
                            </EditIconButton>
                        </InfoValueRow>
                    )}
                </InfoSection>
            </ProfileInfoCard>

            <ContentSections>
                <TrainingTrackerCard>
                    <TrainingHeader>
                        <TrainingIconWrapper>
                            <Trophy size={22} />
                        </TrainingIconWrapper>
                        <TrainingTitleSection>
                            <TrainingTitle>Certification Progress</TrainingTitle>
                            <TrainingSubtitle>Dog Walking Trainer Certification</TrainingSubtitle>
                        </TrainingTitleSection>
                    </TrainingHeader>

                    <TrainingContent>
                        <StatsRow>
                            <StatBox>
                                <StatValue>{totalHours.toFixed(1)}</StatValue>
                                <StatLabel>Hours Completed</StatLabel>
                            </StatBox>
                            <StatDivider />
                            <StatBox>
                                <StatValue>{hoursRemaining.toFixed(1)}</StatValue>
                                <StatLabel>Hours Remaining</StatLabel>
                            </StatBox>
                            <StatDivider />
                            <StatBox>
                                <StatValue>{progressPercent.toFixed(0)}%</StatValue>
                                <StatLabel>Progress</StatLabel>
                            </StatBox>
                        </StatsRow>

                        <ProgressBarContainer>
                            <ProgressBarBackground>
                                <ProgressBarFill $percent={progressPercent}>
                                    <ProgressGlow />
                                </ProgressBarFill>
                            </ProgressBarBackground>
                            <ProgressLabels>
                                <ProgressLabel>0h</ProgressLabel>
                                <ProgressLabel>300h</ProgressLabel>
                            </ProgressLabels>
                        </ProgressBarContainer>

                        <MilestonesContainer>
                            {[
                                { hours: 75, icon: '🌱', label: 'Beginner', color: '#10b981' },
                                { hours: 150, icon: '🌿', label: 'Intermediate', color: '#3b82f6' },
                                { hours: 225, icon: '🌳', label: 'Advanced', color: '#8b5cf6' },
                                { hours: 300, icon: '🏆', label: 'Certified', color: '#f59e0b' }
                            ].map((milestone, index) => {
                                const achieved = totalHours >= milestone.hours;
                                const isNext = totalHours < milestone.hours && (index === 0 || totalHours >= [75, 150, 225][index - 1]);
                                return (
                                    <MilestoneItem key={milestone.hours} $achieved={achieved} $isNext={isNext}>
                                        <MilestoneIcon $achieved={achieved} $color={milestone.color}>
                                            {milestone.icon}
                                        </MilestoneIcon>
                                        <MilestoneLabel $achieved={achieved}>{milestone.label}</MilestoneLabel>
                                        <MilestoneHours $achieved={achieved}>{milestone.hours}h</MilestoneHours>
                                        {achieved && <CheckBadge><Zap size={10} /></CheckBadge>}
                                    </MilestoneItem>
                                );
                            })}
                        </MilestonesContainer>

                        <MotivationalMessage>
                            {progressPercent === 100 ? (
                                <>🎉 Congratulations! You've completed your certification requirements!</>
                            ) : progressPercent >= 75 ? (
                                <>🔥 Almost there! Keep up the amazing work!</>
                            ) : progressPercent >= 50 ? (
                                <>💪 Halfway there! You're doing great!</>
                            ) : progressPercent >= 25 ? (
                                <>⭐ Great start! Keep building those hours!</>
                            ) : (
                                <>🚀 Start your certification journey with training walks!</>
                            )}
                        </MotivationalMessage>
                    </TrainingContent>
                </TrainingTrackerCard>

                <ModernRatesCard>
                    <RatesHeader>
                        <RatesIcon>
                            <DollarSign size={22} />
                        </RatesIcon>
                        <RatesTitleSection>
                            <RatesTitle>Service Rates</RatesTitle>
                            <RatesSubtitle>Manage your walk pricing</RatesSubtitle>
                        </RatesTitleSection>
                    </RatesHeader>
                    <ModernForm onSubmit={handleRateUpdate}>
                        <ModernRateGrid>
                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>30</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="thirty"
                                        value={rates.thirty}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>45</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="fortyfive"
                                        value={rates.fortyfive}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>60</RateDuration>
                                    <RateMinutes>min</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="sixty"
                                        value={rates.sixty}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard $solo>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>Solo</RateDuration>
                                    <RateMinutes>walk</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="solo_rate"
                                        value={rates.solo_rate}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard $training>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>Training</RateDuration>
                                    <RateMinutes>walk</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="training_rate"
                                        value={rates.training_rate}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>

                            <ModernRateCard $sibling>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <RateDuration>Sibling</RateDuration>
                                    <RateMinutes>walk</RateMinutes>
                                </div>
                                <ModernRateInput>
                                    <DollarSymbol>$</DollarSymbol>
                                    <RateField
                                        type="number"
                                        name="sibling_rate"
                                        value={rates.sibling_rate}
                                        onChange={handleRateChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </ModernRateInput>
                            </ModernRateCard>
                        </ModernRateGrid>
                        <ModernUpdateButton type="submit" disabled={isUpdatingRates}>
                            <Settings size={14} />
                            {isUpdatingRates ? 'Saving...' : 'Save Rates'}
                        </ModernUpdateButton>
                    </ModernForm>
                </ModernRatesCard>
            </ContentSections>

            <FinanceOverviewWrapper>
                <YearlyFinanceOverview />
            </FinanceOverviewWrapper>
        </Container>
    );
}

// Styled Components
const Container = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding-bottom: 100px;
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
`;

const ProfileHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 20px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const ProfilePhotoWrapper = styled.div`
    position: relative;
    width: 64px;
    height: 64px;
    flex-shrink: 0;

    &:hover {
        .upload-overlay {
            opacity: 1;
        }
    }
`;

const ProfileIconWrapper = styled.div`
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
`;

const ProfilePhoto = styled.img`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.2);
`;

const PhotoUploadOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }
`;

const PhotoUploadLabel = styled.label`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    color: white;

    .uploading {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const PhotoUploadInput = styled.input`
    display: none;
`;

const ProfileHeaderText = styled.div`
    flex: 1;
`;

const ProfileTitle = styled.h1`
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 4px 0;
`;

const ProfileSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin: 0;
`;

const ProfileInfoCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const InfoSection = styled.div`
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:first-child {
        padding-top: 0;
    }

    &:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
`;

const InfoLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;

    svg {
        flex-shrink: 0;
    }
`;

const InfoValue = styled.div`
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
`;

const InfoValueRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

const EditIconButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 6px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const EditContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const EditInput = styled.input`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid ${props => props.$hasError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
    border-radius: 8px;
    padding: 10px 12px;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
    outline: none;
    transition: all 0.2s ease;

    &::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: ${props => props.$hasError ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.5)'};
        box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const EditActions = styled.div`
    display: flex;
    gap: 8px;
`;

const EditButton = styled.button`
    background: ${props => props.$primary
        ? 'linear-gradient(135deg, #10b981, #06b6d4)'
        : 'rgba(255, 255, 255, 0.1)'};
    border: 1px solid ${props => props.$primary
        ? 'rgba(16, 185, 129, 0.5)'
        : 'rgba(255, 255, 255, 0.2)'};
    border-radius: 8px;
    padding: 8px 16px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 600;

    &:hover:not(:disabled) {
        background: ${props => props.$primary
            ? 'linear-gradient(135deg, #059669, #0891b2)'
            : 'rgba(255, 255, 255, 0.2)'};
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const ErrorText = styled.div`
    color: #fca5a5;
    font-size: 0.75rem;
    font-weight: 500;
    margin-top: 4px;
`;

const ContentSections = styled.div`
    display: flex;
    flex-direction: column;
`;

const FinanceOverviewWrapper = styled.div`
    width: 100%;
    position: relative;
    z-index: 1;
`;

// Training Tracker Components
const TrainingTrackerCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    border-top: 2px solid rgba(255, 215, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.03) 0%, transparent 70%);
        animation: shimmer 8s linear infinite;
        z-index: 0;
    }

    @keyframes shimmer {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const TrainingHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
`;

const TrainingIconWrapper = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    animation: trophyPulse 3s ease-in-out infinite;

    @keyframes trophyPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
        50% { transform: scale(1.05); box-shadow: 0 8px 28px rgba(245, 158, 11, 0.6); }
    }
`;

const TrainingTitleSection = styled.div`
    flex: 1;
`;

const TrainingTitle = styled.h3`
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    background: linear-gradient(135deg, #ffffff, #fbbf24);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const TrainingSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin: 0;
`;

const TrainingContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
`;

const StatsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 16px;
    align-items: center;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 12px;
    }
`;

const StatBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

const StatValue = styled.div`
    font-size: 2rem;
    font-weight: 800;
    color: #fbbf24;
    line-height: 1;
    text-shadow: 0 2px 10px rgba(251, 191, 36, 0.4);

    @media (max-width: 480px) {
        font-size: 1.6rem;
    }
`;

const StatLabel = styled.div`
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
`;

const StatDivider = styled.div`
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 480px) {
        display: none;
    }
`;

const ProgressBarContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ProgressBarBackground = styled.div`
    width: 100%;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.15);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const ProgressBarFill = styled.div`
    width: ${props => props.$percent}%;
    height: 100%;
    background: linear-gradient(90deg, #10b981, #22c55e, #fbbf24);
    border-radius: 12px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
`;

const ProgressGlow = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: progressShine 2s infinite;

    @keyframes progressShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;

const ProgressLabels = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
`;

const ProgressLabel = styled.span`
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
`;

const MilestonesContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const MilestoneItem = styled.div`
    background: ${props =>
        props.$achieved ? 'rgba(16, 185, 129, 0.15)' :
        props.$isNext ? 'rgba(59, 130, 246, 0.1)' :
        'rgba(255, 255, 255, 0.05)'};
    border: 2px solid ${props =>
        props.$achieved ? 'rgba(16, 185, 129, 0.4)' :
        props.$isNext ? 'rgba(59, 130, 246, 0.3)' :
        'rgba(255, 255, 255, 0.1)'};
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    position: relative;
    transition: all 0.3s ease;

    ${props => props.$achieved && `
        animation: milestoneAchieved 0.5s ease;
    `}

    @keyframes milestoneAchieved {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;

const MilestoneIcon = styled.div`
    font-size: 1.8rem;
    opacity: ${props => props.$achieved ? 1 : 0.4};
    filter: ${props => props.$achieved ? 'none' : 'grayscale(100%)'};
    transition: all 0.3s ease;
`;

const MilestoneLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    color: ${props => props.$achieved ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
    text-align: center;
`;

const MilestoneHours = styled.div`
    font-size: 0.7rem;
    color: ${props => props.$achieved ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
    font-weight: 500;
`;

const CheckBadge = styled.div`
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
    animation: checkBounce 0.5s ease;

    @keyframes checkBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
`;

const MotivationalMessage = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px 18px;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
    animation: fadeIn 0.5s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

// Rates Card Components
const ModernRatesCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const RatesHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
`;

const RatesIcon = styled.div`
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #10b981, #06b6d4);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
`;

const RatesTitleSection = styled.div`
    flex: 1;
`;

const RatesTitle = styled.h3`
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 4px 0;
`;

const RatesSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin: 0;
`;

const ModernForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const ModernRateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 480px) {
        gap: 8px;
    }
`;

const ModernRateCard = styled.div`
    background: ${props =>
        props.$training ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.08))' :
        props.$solo ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.08))' :
        props.$sibling ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.08))' :
        'rgba(255, 255, 255, 0.04)'};
    border: 1px solid ${props =>
        props.$training ? 'rgba(245, 158, 11, 0.25)' :
        props.$solo ? 'rgba(168, 85, 247, 0.25)' :
        props.$sibling ? 'rgba(236, 72, 153, 0.25)' :
        'rgba(255, 255, 255, 0.08)'};
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    &:hover {
        transform: translateY(-1px);
        background: ${props =>
            props.$training ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))' :
            props.$solo ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))' :
            props.$sibling ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1))' :
            'rgba(255, 255, 255, 0.06)'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 480px) {
        padding: 8px;
        gap: 6px;
    }
`;

const RateDuration = styled.div`
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    white-space: nowrap;

    @media (max-width: 480px) {
        font-size: 1rem;
    }
`;

const RateMinutes = styled.div`
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
`;

const ModernRateInput = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 6px 8px;
    transition: all 0.3s ease;
    min-width: 0;
    overflow: hidden;

    &:focus-within {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.08);
    }

    @media (max-width: 480px) {
        padding: 5px 6px;
    }
`;

const DollarSymbol = styled.span`
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    font-weight: 600;
    margin-right: 2px;
`;

const RateField = styled.input`
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    width: 100%;
    max-width: 60px;
    outline: none;

    &::placeholder {
        color: rgba(255, 255, 255, 0.25);
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    @media (max-width: 480px) {
        font-size: 0.85rem;
        max-width: 50px;
    }
`;

const ModernUpdateButton = styled.button`
    background: linear-gradient(135deg, #10b981, #06b6d4);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
    margin-top: 4px;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }
`;
