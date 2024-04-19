import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';

import './ContextMenu.css';

interface ContextMenuProps {
    onAction: (action: string, data: any) => void;
    rowData: any;
    isOpen: boolean;
    x: number;
    y: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ onAction, rowData, isOpen, x, y }) => {
    const handleAction = (action: string) => onAction(action, rowData);
    const [_myPos, setMyPos] = useState({ x: 0, y: 0 });

    // Any click anywhere hides a visible context menu:
    const handleClick = () => {
        if (isOpen) {
            handleAction('');
        }
    }

    // As does the Escape key:
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            handleAction('');
            event.stopPropagation();
            event.preventDefault();
        }
    }

    // Invert the menu position to stop it going off sceren
    useEffect(() => {
        let myX = x;
        let myY = y;

        const EL_WIDTH = 200;
        const EL_HEIGHT = 120;

        if (myX > window.innerWidth - EL_WIDTH) {
            myX = window.innerWidth - EL_WIDTH;
        }

        if (myY > window.innerHeight - EL_HEIGHT) {
            myY = window.innerWidth - EL_HEIGHT;
        }

        setMyPos({ x: myX, y: myY });
    }, [x, y]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClick);
        };
    });


    return !isOpen ? null : (
        <nav id="context-menu" style={{ top: y, left: x }}>
            <li onClick={() => handleAction('showPointOnMap')}>{get('feature_table.context_menu.showPointOnMap')}</li>
            <li onClick={() => handleAction('showDetails')}>{get('feature_table.context_menu.showDetails')}</li>
            <hr />
            <li onClick={() => handleAction('')}> {get('close')}</li>
        </nav >
    );
};

export default ContextMenu;
