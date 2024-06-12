import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import styled from 'styled-components';

const StyledListGroupItem = styled(ListGroup.Item)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export default function EditCancellationsModal({ show, handleClose, cancellations, deleteCancellation }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Cancellations</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup variant="flush">
                    {cancellations.length < 1 && (
                        <ListGroup.Item>No cancellations currently.</ListGroup.Item>
                    )}
                    {cancellations.map(cancellation => (
                        <StyledListGroupItem key={cancellation.id}>
                            <span>{new Date(cancellation.date).toLocaleDateString('en-US')}</span>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => deleteCancellation(cancellation.id)}
                            >
                                Delete
                            </Button>
                        </StyledListGroupItem>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}
