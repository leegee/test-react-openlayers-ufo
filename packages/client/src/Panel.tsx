import React, { useState } from 'react';
import { get } from 'react-intl-universal';

import './Panel.css';

const Panel: React.FC = () => {
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
            <p>{get('panel.contentholder')}</p>
        </div>
    );
};

export default Panel;
