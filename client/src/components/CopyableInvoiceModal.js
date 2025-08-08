import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import dayjs from "dayjs";
import { Eye, X, Copy, Check, Receipt, DollarSign } from "lucide-react";

const CopyableInvoicesModal = ({ unpaidInvoices, onClose, total }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!unpaidInvoices || unpaidInvoices.length === 0) return null;

    const formattedText = unpaidInvoices.map(invoice => {
        const formattedDate = dayjs(invoice.date_completed).format('MM/DD');
        return `${invoice.title} | ${formattedDate} | $${invoice.compensation}`;
    }).join('\n') + `\n\nTotal: $${total.toFixed(2)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formattedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = formattedText;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
            document.body.removeChild(textArea);
        }
    };

    const modalContent = (
        <ModalOverlay onClick={handleOverlayClick}>
            <ModalContainer>
                <ModalHeader>
                    <ModalTitle>
                        <Eye size={24} />
                        Copyable Invoice Summary
                    </ModalTitle>
                    <CloseButton onClick={onClose}>
                        <X size={18} />
                    </CloseButton>
                </ModalHeader>
                
                <ModalContent>
                    <InvoicePreview>
                        <PreviewHeader>
                            <Receipt size={20} />
                            Invoice Details
                        </PreviewHeader>
                        
                        <InvoiceList>
                            {unpaidInvoices.map((invoice, index) => (
                                <InvoiceItem key={invoice.id}>
                                    <InvoiceItemContent>
                                        <ServiceTitle>{invoice.title}</ServiceTitle>
                                        <InvoiceItemDetails>
                                            <InvoiceDate>
                                                {dayjs(invoice.date_completed).format('MMM DD')}
                                            </InvoiceDate>
                                            <InvoiceAmount>${invoice.compensation}</InvoiceAmount>
                                        </InvoiceItemDetails>
                                    </InvoiceItemContent>
                                </InvoiceItem>
                            ))}
                        </InvoiceList>
                        
                        <TotalSection>
                            <TotalLabel>Total Amount</TotalLabel>
                            <TotalAmount>
                                <DollarSign size={18} />
                                ${total.toFixed(2)}
                            </TotalAmount>
                        </TotalSection>
                    </InvoicePreview>

                    <CopySection>
                        <CopyLabel>Formatted for copy & paste:</CopyLabel>
                        <CopyTextArea 
                            value={formattedText}
                            readOnly
                            onClick={(e) => e.target.select()}
                        />
                        
                        <CopyButton onClick={handleCopy} $copied={copied}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </CopyButton>
                    </CopySection>

                    <CloseButtonContainer>
                        <CloseModalButton onClick={onClose}>
                            <X size={16} />
                            Close
                        </CloseModalButton>
                    </CloseButtonContainer>
                </ModalContent>
            </ModalContainer>
        </ModalOverlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default CopyableInvoicesModal;

// Modern Styled Components matching your app's design
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10004;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(10px);
        }
    }
`;

const ModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.95), rgba(107, 43, 107, 0.9));
    border-radius: 24px;
    border: 2px solid rgba(139, 90, 140, 0.5);
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: slideUp 0.3s ease-out;
    
    @keyframes slideUp {
        from {
            transform: translateY(30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 24px 0;
    margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
        transform: scale(1.1);
    }
`;

const ModalContent = styled.div`
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    
    @media (max-width: 768px) {
        padding: 0 16px 20px;
        gap: 20px;
    }
`;

const InvoicePreview = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 20px;
    backdrop-filter: blur(15px);
`;

const PreviewHeader = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const InvoiceList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
`;

const InvoiceItem = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 16px;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const InvoiceItemContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 6px;
    }
`;

const ServiceTitle = styled.span`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    flex: 1;
`;

const InvoiceItemDetails = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    
    @media (max-width: 480px) {
        justify-content: space-between;
        width: 100%;
    }
`;

const InvoiceDate = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    font-weight: 500;
`;

const InvoiceAmount = styled.span`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const TotalSection = styled.div`
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const TotalLabel = styled.span`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
    font-weight: 600;
`;

const TotalAmount = styled.div`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.4rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CopySection = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px;
    backdrop-filter: blur(10px);
    
    @media (max-width: 768px) {
        padding: 16px;
        margin: 0 -2px;
    }
`;

const CopyLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 12px;
`;

const CopyTextArea = styled.textarea`
    width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 0.85rem;
    color: #ffffff;
    resize: none;
    height: 120px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    user-select: all;
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
    
    &::selection {
        background: rgba(165, 105, 167, 0.3);
    }
    
    @media (max-width: 768px) {
        font-size: 0.8rem;
        height: 100px;
        padding: 12px;
    }
`;

const CopyButton = styled.button`
    background: ${({ $copied }) => 
        $copied ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #8b5a8c, #a569a7)'
    };
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: ${({ $copied }) => 
        $copied ? '0 4px 16px rgba(34, 197, 94, 0.3)' : '0 4px 16px rgba(139, 90, 140, 0.3)'
    };
    width: 100%;
    
    &:hover {
        background: ${({ $copied }) => 
            $copied ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #7d527e, #936394)'
        };
        transform: translateY(-2px);
        box-shadow: ${({ $copied }) => 
            $copied ? '0 6px 20px rgba(34, 197, 94, 0.4)' : '0 6px 20px rgba(139, 90, 140, 0.4)'
        };
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const CloseButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CloseModalButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(5px);
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
`;