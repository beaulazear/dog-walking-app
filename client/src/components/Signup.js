import React, { useState, useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user.js";

const Signup = () => {
    const { setUser } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                fourty: parseInt(28),
                sixty: parseInt(33),
                solo_rate: parseInt(5),
            }),
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
            setUser(data);
        } else {
            setError(data.errors ? data.errors.join(", ") : "Signup failed.");
        }
    };

    return (
        <SignupWrapper>
            <SignupBox>
                <Title>Create an Account</Title>
                <Form onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                    />
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    <SignupButton type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Sign Up"}
                    </SignupButton>
                </Form>
                <Divider />
                <LoginPrompt>
                    Already have an account? <LoginLink href="/login">Log In</LoginLink>
                </LoginPrompt>
            </SignupBox>
        </SignupWrapper>
    );
};

export default Signup;

const SignupWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
`;

const SignupBox = styled.div`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    text-align: center;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 20px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.3);
    color: #fff;
    outline: none;
    transition: 0.3s ease-in-out;

    &:focus {
        background: rgba(255, 255, 255, 0.5);
    }
`;

const SignupButton = styled.button`
    background: #ff758c;
    color: white;
    padding: 12px;
    font-size: 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: #ff5864;
    }

    &:disabled {
        background: #aaa;
        cursor: not-allowed;
    }
`;

const ErrorMessage = styled.p`
    color: #ffdddd;
    font-size: 14px;
    margin-bottom: 12px;
`;

const Divider = styled.hr`
    margin: 20px 0;
    border: none;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
`;

const LoginPrompt = styled.p`
    color: white;
    font-size: 14px;
`;

const LoginLink = styled.a`
    color: #fff;
    font-weight: bold;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;