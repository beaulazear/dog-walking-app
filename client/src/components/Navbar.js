import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components";
import { UserContext } from "../context/user";

const Navbar = () => {
    const { user } = useContext(UserContext);

    return (
        <NavBar>
            <NavContent>
                <Brand to="/">Pocket Walks</Brand>
                <NavLinks>
                    {!user ? (
                        <>
                            <StyledNavLink to="/login">Login</StyledNavLink>
                            <StyledNavLink to="/signup">Signup</StyledNavLink>
                        </>
                    ) : (
                        <>
                            <StyledNavLink to="/todays-walks">Today</StyledNavLink>
                            <StyledNavLink to="/pets-page">Pets</StyledNavLink>
                        </>
                    )}
                </NavLinks>
            </NavContent>
        </NavBar>
    );
};

export default Navbar;

const NavBar = styled.nav`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 15px 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
`;

const NavContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    max-width: 1000px;
    margin: 0 auto;
`;

const Brand = styled(Link)`
    text-decoration: none;
    font-size: 22px;
    font-weight: bold;
    color: white;
    transition: color 0.3s ease-in-out;

    &:hover {
        color: #ff758c;
    }
`;

const NavLinks = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
`;

const StyledNavLink = styled(NavLink)`
    text-decoration: none;
    font-size: 16px;
    font-weight: bold;
    color: white;
    padding: 8px 15px;
    border-radius: 6px;
    transition: all 0.3s ease-in-out;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    &.active {
        background: rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
`;