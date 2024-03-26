import React, { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, title }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
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
                    <Link to='/'><nav id='modal-close' onClick={() => setIsOpen(false)}></nav></Link>
                </h2>
                <div id='modal-inner'>
                    {children}
                </div>
            </div>
        </section>
    ) : null;
};

export default Modal;
