import React from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const CloseButton = styled.button`
  background: #d8b4ff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: bold;
  
  &:hover {
    background: #cfa8f7;
  }
`;

const InvoiceList = styled.pre`
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 5px;
  text-align: left;
  white-space: pre-wrap;
  font-size: 0.9rem;
  user-select: all;
`;

const CopyableInvoicesModal = ({ unpaidInvoices, onClose, total }) => {
  if (!unpaidInvoices || unpaidInvoices.length === 0) return null;

  const formattedInvoices = unpaidInvoices.map(invoice => {
    const formattedDate = new Date(invoice.date_completed).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    return `${invoice.title} | ${formattedDate} | $${invoice.compensation}`;
  }).join("\n");

  return (
    <ModalOverlay>
      <ModalContent>
        <h2>Copyable Invoices</h2>
        <InvoiceList>{formattedInvoices}</InvoiceList>
        <h4>Total: ${total}</h4>
        <CloseButton onClick={onClose}>Close</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CopyableInvoicesModal;