import styled from 'styled-components';

export const ListContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

export const ListItem = styled.div`
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
`;

export const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

export const DeleteButton = styled.button`
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
`;