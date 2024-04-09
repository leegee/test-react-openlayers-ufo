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
    const [currentlyOpen, setCurrentlyOpen] = useState<boolean>(isOpen);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setCurrentlyOpen(false);
            event.stopPropagation();
            event.preventDefault();
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    useEffect(() => {
        setCurrentlyOpen(isOpen);
    }, [isOpen]);

    return !currentlyOpen ? null : (
        <div
            id="context-menu"
            style={{ top: y, left: x }}
        >
            <div onClick={() => handleAction('showPointOnMap')}>{get('feature_table.context_menu.showPointOnMap')}</div>
            <div onClick={() => handleAction('showDetails')}>{get('feature_table.context_menu.showDetails')}</div>
        </div>
    );
};

export default ContextMenu;
