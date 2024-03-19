import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
}

export const CLOSE_MODAL = 'ufo-close-modal';

export const dispatchCloseModalEvent = () => document.dispatchEvent(
    new CustomEvent(CLOSE_MODAL) as CustomEvent
);

const Modal: React.FC<ModalProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const allowedPaths = ['about', 'contact', 'histogram'];

    const shouldRenderContent = allowedPaths.some(path => location.pathname.includes(path));

    function handleClose() {
        navigate(-1);
    }

    useEffect(() => {
        document.addEventListener(CLOSE_MODAL, handleClose);
        return () => document.removeEventListener(CLOSE_MODAL, handleClose);
    }, []);

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
