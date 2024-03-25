import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, title }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    function handleClose() {
        setIsOpen(false);
        navigate(-1);
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                handleClose();
            }
        }

        setIsOpen(true);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    });

    return isOpen ? (
        <section id="modal">
            <div id='modal-content'>
                <h2>{title}
                    <nav id='modal-close' onClick={handleClose}></nav>
                </h2>
                <div id='modal-inner'>
                    {children}
                </div>
            </div>
        </section>
    ) : null;
};

export default Modal;
