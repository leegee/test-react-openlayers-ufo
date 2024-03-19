import React, { ReactNode } from 'react';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ children }) => {
    return (
        <section className="modal"><div className='modal-content'>
            {children}
        </div></section>
    );
};

export default Modal;
