import React from 'react';
import {
    ListContainer,
    ListItem,
    ItemHeader,
    DeleteButton
} from '../styles/AdditionalIncomeList.styles';

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
