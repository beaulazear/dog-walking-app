import React from 'react';
import styled from 'styled-components';

const ListContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const ListItem = styled.div`
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const DeleteButton = styled.button`
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
`;

const AdditionalIncomeList = ({ items, handleIncomeDelete }) => {

    const confirmDelete = (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            handleIncomeDelete(itemId);
        }
    };

    return (
        <ListContainer>
            {items.map((item) => (
                <ListItem key={item.id}>
                    <ItemHeader>
                        <div>
                            <span>Amount: ${item.compensation}</span>
                            <br />
                            <span>Date Added: {item.date_added.slice(0, 10)}</span>
                            <br />
                            <span>Description: {item.description}</span>
                        </div>
                        <DeleteButton onClick={() => confirmDelete(item.id)}>Delete</DeleteButton>
                    </ItemHeader>
                </ListItem>
            ))}
        </ListContainer>
    );
};

export default AdditionalIncomeList;
