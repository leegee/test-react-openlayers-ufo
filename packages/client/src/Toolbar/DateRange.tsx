// Toolbar.tsx
import React from 'react';

import './DateRange.css';

const DateRange: React.FC = () => {
    return (<aside className='date-range'>
        <label title='Date'>
            <input type="range" id="dateRange" name="dateRange" min="1900-01-01" max="2022-12-31" value="2022-06-01" />
        </label>
    </aside>)
}

export default DateRange;