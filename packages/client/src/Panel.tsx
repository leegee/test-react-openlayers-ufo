import React, { useState } from 'react';
import { get } from 'react-intl-universal';

import './Panel.css';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const toggleCollapse = () => {
        setCollapsed(prevCollapsed => !prevCollapsed);
    };

    return (
        <div className={`panel ${collapsed ? 'collapsed' : ''}`}>
            <header>
                <span>
                    {get('panel.headerTitle')}
                </span>
                <button className="collapse-btn" onClick={toggleCollapse} />
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};

export default Panel;
