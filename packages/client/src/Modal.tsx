import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
}


const Modal: React.FC<ModalProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const allowedPaths = ['about', 'contact', 'histogram'];

    const shouldRenderContent = allowedPaths.some(path => location.pathname.includes(path));

    function handleClose() {
        navigate(-1);
    }

    return shouldRenderContent ? (
        <section className="modal">
            <div className='modal-content'>
                <nav className='modal-close' onClick={handleClose}></nav>
                {children}
            </div>
        </section>
    ) : null;
};

export default Modal;
