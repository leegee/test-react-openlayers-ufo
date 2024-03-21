import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
    allowedRoutes: string[];
}

const Modal: React.FC<ModalProps> = ({ children, allowedRoutes }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const shouldRenderContent = allowedRoutes.some(path => location.pathname.includes(path));

    function handleClose() {
        setIsOpen(false);
        navigate(-1);
    }

    useEffect(() => {
        if (shouldRenderContent) {
            setIsOpen(true);
        }
    }, [shouldRenderContent]);

    return isOpen ? (
        <section className="modal">
            <div className='modal-content'>
                <nav className='modal-close' onClick={handleClose}></nav>
                {children}
            </div>
        </section>
    ) : null;
};

export default Modal;
