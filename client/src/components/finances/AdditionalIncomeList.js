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

const AdditionalIncomeList = ({ items }) => {
    console.log(items)

    return (
        <ListContainer>
            {items.map(item => (
                <ListItem key={item.id}>
                    <ItemHeader>
                        <div>
                            <span>Amount: ${item.compensation}</span>
                            <br />
                            <span>Date Added: {item.date_added.slice(0,10)}</span>
                            <br />
                            <span>Description: {item.description}</span>
                        </div>
                    </ItemHeader>
                </ListItem>
            ))}
        </ListContainer>
    );
};

export default AdditionalIncomeList;
