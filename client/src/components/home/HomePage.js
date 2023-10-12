import React, { useContext } from "react";
import { UserContext } from "../../context/user";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container"

export default function HomePage() {

    const { user } = useContext(UserContext)
    console.log(user)

    if (user) {
        return (
            <div>
                <Container fluid className="m-3">
                    <h1 className="display-4">Welcome, {user.username}.</h1>
                </Container>
            </div>
        )
    } else {
        return (
            <Container fluid className="m-3">
                <h1 className="display-4">Welcome to PocketWalks!</h1>
            </Container>
        )
    }
}
