import React, { useState, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { Link } from "react-router-dom";
import { UserContext } from "../context/user.js";
import { UserPlus, User, Mail, Lock, UserCircle, Eye, EyeOff } from "lucide-react";
import dogImage from "../assets/dog.png";

const Signup = () => {
    const { setUser } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const handleFocus = (field) => {
        setFocusedField(field);
        setIsKeyboardOpen(true);
        setTimeout(() => {
            const element = document.activeElement;
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleBlur = () => {
        setFocusedField(null);
        setTimeout(() => {
            setIsKeyboardOpen(false);
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const response = await fetch("/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                email_address: email,
                name,
                password,
                password_confirmation: passwordConfirmation,
                thirty: parseInt(22),
                fortyfive: parseInt(28),
                sixty: parseInt(33),
                solo_rate: parseInt(5),
            }),
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
            // Store JWT token in localStorage
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            setUser(data.user || data);
        } else {
            setError(data.errors ? data.errors.join(", ") : "Signup failed.");
        }
    };

    const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation;

    return (
        <SignupWrapper $isKeyboardOpen={isKeyboardOpen}>
            <FloatingPaws $delay="0s" $startX="10%" />
            <FloatingPaws $delay="2s" $startX="30%" />
            <FloatingPaws $delay="4s" $startX="50%" />
            <FloatingPaws $delay="6s" $startX="70%" />
            <FloatingPaws $delay="8s" $startX="90%" />
            <FloatingPaws $delay="1s" $startX="20%" />
            <FloatingPaws $delay="3s" $startX="40%" />
            <FloatingPaws $delay="5s" $startX="60%" />
            <FloatingPaws $delay="7s" $startX="80%" />
            
            <ContentContainer $isKeyboardOpen={isKeyboardOpen}>
                <HeaderContainer>
                    <DogImageWrapper>
                        <DogImage src={dogImage} alt="Dog" loading="lazy" />
                    </DogImageWrapper>
                    <WelcomeText>
                        Create Account
                    </WelcomeText>
                </HeaderContainer>
                
                <SignupBox>
                    <Form onSubmit={handleSubmit}>
                        <InputRow>
                            <InputGroup>
                                <InputWrapper $focused={focusedField === 'username'}>
                                    <InputIcon>
                                        <User size={18} />
                                    </InputIcon>
                                    <Input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onFocus={() => handleFocus('username')}
                                        onBlur={handleBlur}
                                        required
                                    />
                                </InputWrapper>
                            </InputGroup>
                            
                            <InputGroup>
                                <InputWrapper $focused={focusedField === 'name'}>
                                    <InputIcon>
                                        <UserCircle size={18} />
                                    </InputIcon>
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => handleFocus('name')}
                                        onBlur={handleBlur}
                                        required
                                    />
                                </InputWrapper>
                            </InputGroup>
                        </InputRow>
                        
                        <InputGroup>
                            <InputWrapper $focused={focusedField === 'email'}>
                                <InputIcon>
                                    <Mail size={18} />
                                </InputIcon>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => handleFocus('email')}
                                    onBlur={handleBlur}
                                    required
                                />
                            </InputWrapper>
                        </InputGroup>
                        
                        <InputGroup>
                            <InputWrapper $focused={focusedField === 'password'}>
                                <InputIcon>
                                    <Lock size={18} />
                                </InputIcon>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => handleFocus('password')}
                                    onBlur={handleBlur}
                                    required
                                />
                                <TogglePassword onClick={() => setShowPassword(!showPassword)} type="button">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </TogglePassword>
                            </InputWrapper>
                        </InputGroup>
                        
                        <InputGroup>
                            <InputWrapper $focused={focusedField === 'confirmPassword'} $valid={passwordsMatch}>
                                <InputIcon>
                                    <Lock size={18} />
                                </InputIcon>
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    onFocus={() => handleFocus('confirmPassword')}
                                    onBlur={handleBlur}
                                    required
                                />
                                <TogglePassword onClick={() => setShowConfirmPassword(!showConfirmPassword)} type="button">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </TogglePassword>
                            </InputWrapper>
                        </InputGroup>
                        
                        {error && (
                            <ErrorMessage>
                                <span>⚠️</span> {error}
                            </ErrorMessage>
                        )}
                        
                        <SignupButton type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <LoadingSpinner />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Sign Up</span>
                                </>
                            )}
                        </SignupButton>
                    </Form>
                    
                    <LoginPrompt>
                        <LoginLink to="/login">
                            Login
                            <span>→</span>
                        </LoginLink>
                    </LoginPrompt>
                </SignupBox>
            </ContentContainer>
        </SignupWrapper>
    );
};

export default Signup;

const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  75% { transform: translateY(5px) rotate(5deg); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pawFloat = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  5% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.2;
    transform: translateY(50vh) rotate(180deg) scale(1);
  }
  95% {
    opacity: 0.15;
  }
  100% {
    transform: translateY(-50px) rotate(360deg) scale(0.8);
    opacity: 0;
  }
`;

const SignupWrapper = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: ${props => props.$isKeyboardOpen ? 'flex-start' : 'center'};
    justify-content: center;
    padding: 20px;
    padding-top: ${props => props.$isKeyboardOpen ? '60px' : '80px'};
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    transition: all 0.3s ease;
    
    @media (max-width: 768px) {
        align-items: ${props => props.$isKeyboardOpen ? 'flex-start' : 'flex-start'};
        padding-top: ${props => props.$isKeyboardOpen ? '40px' : '60px'};
    }
    
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
        animation: ${float} 30s linear infinite;
        pointer-events: none;
    }
`;

const FloatingPaws = styled.div`
    position: absolute;
    font-size: 1.5rem;
    animation: ${pawFloat} 20s linear infinite;
    animation-delay: ${props => props.$delay || '0s'};
    pointer-events: none;
    opacity: 0.15;
    left: ${props => props.$startX || '0%'};
    
    &::before {
        content: '🐾';
        filter: grayscale(20%) brightness(1.2);
    }
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${props => props.$isKeyboardOpen ? '1rem' : '2rem'};
    z-index: 1;
    animation: ${fadeIn} 0.8s ease-out;
    padding-top: 1rem;
    transition: all 0.3s ease;
    transform: ${props => props.$isKeyboardOpen ? 'translateY(-20px)' : 'translateY(0)'};
    
    @media (max-width: 768px) {
        padding-top: 0.5rem;
        gap: ${props => props.$isKeyboardOpen ? '0.75rem' : '1.5rem'};
        transform: ${props => props.$isKeyboardOpen ? 'translateY(-30px)' : 'translateY(0)'};
    }
`;

const HeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0;
    
    @media (max-width: 768px) {
        gap: 0.5rem;
    }
`;

const DogImageWrapper = styled.div`
    position: relative;
`;

const DogImage = styled.img`
    width: 80px;
    height: auto;
    filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
    
    @media (max-width: 768px) {
        width: 70px;
    }
    
    &:hover {
        transform: scale(1.05);
    }
`;


const WelcomeText = styled.h1`
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-align: center;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.5px;
    
    @media (max-width: 768px) {
        font-size: 1.25rem;
    }
`;

const SignupBox = styled.div`
    padding: 1.5rem;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    @media (max-width: 768px) {
        padding: 1rem;
        gap: 1.25rem;
        max-width: 100%;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    @media (max-width: 768px) {
        gap: 0.875rem;
    }
`;

const InputRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.875rem;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
`;

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 2px solid ${props => 
        props.$valid ? '#38a169' : 
        props.$focused ? '#4c51bf' : '#cbd5e0'
    };
    border-radius: 16px;
    box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.8) inset;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
        border-color: ${props => 
            props.valid ? '#38a169' : 
            props.focused ? '#4c51bf' : '#a0aec0'
        };
    }
    
    &:focus-within {
        border-color: ${props => props.valid ? '#38a169' : '#4c51bf'};
        box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.2),
            0 0 0 3px ${props => props.valid ? 'rgba(56, 161, 105, 0.1)' : 'rgba(76, 81, 191, 0.1)'},
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
    }
`;

const InputIcon = styled.div`
    position: absolute;
    left: 1rem;
    color: #4a5568;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
`;

const Input = styled.input`
    width: 100%;
    padding: 0.875rem 3rem;
    border: none;
    background: transparent;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #1a202c;
    outline: none;
    
    &::placeholder {
        color: #718096;
        opacity: 1;
    }
`;

const TogglePassword = styled.button`
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #4a5568;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border-radius: 4px;
    
    &:hover {
        color: #1a202c;
        background-color: rgba(0, 0, 0, 0.05);
        transform: scale(1.05);
    }
    
    &:focus {
        outline: 2px solid #4c51bf;
        outline-offset: 2px;
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

const SignupButton = styled.button`
    background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
    color: white;
    padding: 1rem 2rem;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
    box-shadow: 0 6px 20px rgba(76, 81, 191, 0.3);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
    }
    
    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #553c9a 0%, #44337a 100%);
        transform: translateY(-1px);
        box-shadow: 0 10px 30px rgba(76, 81, 191, 0.4);
        
        &::before {
            left: 100%;
        }
    }
    
    &:focus {
        outline: 3px solid rgba(76, 81, 191, 0.5);
        outline-offset: 2px;
    }
    
    &:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
    }
    
    &:disabled {
        background: #a0aec0;
        cursor: not-allowed;
        box-shadow: none;
        opacity: 0.6;
    }
`;

const LoadingSpinner = styled.div`
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const ErrorMessage = styled.div`
    background: #fed7d7;
    color: #742a2a;
    font-family: 'Poppins', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 2px solid #fc8181;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: ${fadeIn} 0.3s ease;
    
    span {
        font-size: 1rem;
        font-weight: 700;
    }
`;

const LoginPrompt = styled.div`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
`;

const LoginLink = styled(Link)`
    color: #ffffff;
    font-weight: 700;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    
    span {
        transition: transform 0.2s ease;
    }
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
        
        span {
            transform: translateX(4px);
        }
    }
    
    &:focus {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }
`;