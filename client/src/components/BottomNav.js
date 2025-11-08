import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Home, Calendar, Dog, Users } from "lucide-react";

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/todays-walks", icon: Calendar, label: "Today" },
        { path: "/pets-page", icon: Dog, label: "Pets" },
        { path: "/team", icon: Users, label: "Team" },
    ];

    const isActive = (path) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <Nav>
            <NavContainer>
                {tabs.map(({ path, icon: Icon, label }) => (
                    <NavButton
                        key={path}
                        onClick={() => navigate(path)}
                        $active={isActive(path)}
                    >
                        <Icon size={24} />
                        <Label>{label}</Label>
                    </NavButton>
                ))}
            </NavContainer>
        </Nav>
    );
}

const Nav = styled.nav`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    backdrop-filter: blur(10px);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
`;

const NavContainer = styled.div`
    max-width: 448px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 8px 24px;

    @media (min-width: 768px) {
        padding: 10px 32px;
    }
`;

const NavButton = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 20px;
    border: none;
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.6)'};

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
    }

    &:active {
        transform: scale(0.95);
    }

    svg {
        flex-shrink: 0;
    }
`;

const Label = styled.span`
    font-size: 11px;
    font-weight: 600;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;
