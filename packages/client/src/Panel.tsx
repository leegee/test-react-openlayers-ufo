import React, { useState } from 'react';
import './Panel.css'; // Import your component's CSS file for styling

interface PanelProps {
    // Define your props interface here
}

const Panel: React.FC<PanelProps> = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const toggleCollapse = () => {
        setCollapsed(prevCollapsed => !prevCollapsed);
    };

    return (
        <div className={`panel ${collapsed ? 'collapsed' : ''}`}>
            <header>
                <span>Title</span>
                <button className="collapse-btn" onClick={toggleCollapse}>X</button>
            </header>
            <p>Content here</p>
        </div>
    );
};

export default Panel;
