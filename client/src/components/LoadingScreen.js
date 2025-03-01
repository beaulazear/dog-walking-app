import React from "react";
import styled, { keyframes } from "styled-components";
import dogImage from "../assets/dog.png";

export default function LoadingScreen() {
  return (
    <LoaderContainer>
      <DogImage src={dogImage} alt="Pocket Walks Mascot" />
      <LoadingText>Loading...</LoadingText>
    </LoaderContainer>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #ff9a9e, #fad0c4);
  text-align: center;
  animation: ${fadeIn} 1s ease-in-out;
`;

const DogImage = styled.img`
  width: 150px;
  height: auto;
  animation: ${fadeIn} 1s ease-in-out infinite alternate;
`;

const LoadingText = styled.h1`
  color: white;
  font-size: 1.8rem;
  margin-top: 20px;
  font-weight: bold;
  animation: ${fadeIn} 1s ease-in-out infinite alternate;
`;