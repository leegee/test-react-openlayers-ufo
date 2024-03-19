import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ children }) => {
    const location = useLocation();
    const allowedPaths = ['about', 'contact', 'histogram'];

    const shouldRenderContent = allowedPaths.some(path => location.pathname.includes(path));

    return shouldRenderContent ? (
        <section className="modal"><div className='modal-content'>
            {children}
        </div></section>
    ) : null;
};

export default Modal;
