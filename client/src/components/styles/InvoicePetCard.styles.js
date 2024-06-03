import styled from 'styled-components';

export const FormContainer = styled.div`
  margin-bottom: 20px;
`;

export const FormTitle = styled.h3`
  margin-right: 5px;
`;

export const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 10px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-left: 5px;
  margin-right: 5px;
  padding: 5px;
`;

export const FormField = styled.div`
  margin-bottom: 10px;
`;

export const Label = styled.label`
  font-weight: bold;
`;

export const Input = styled.input`
  padding: 8px;
  margin-left: 4px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const FormButton = styled.button`
  padding: 10px;
  font-size: 16px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;
