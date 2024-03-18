import React, { useEffect } from 'react';

import { REPORT_FULL_WIDTH, REPORT_NARROW_WIDTH } from './custom-events/report-width';
import FeatureTable from './FeaturesTable';
import Map from './Map';
import Panel from './ResultsPanel';
import Toolbar from './Toolbar';
import MapWithTooltips from './Map/MapWithTooltips';

import './App.css';

function setScreenSizeClass() {
  if (window.innerWidth < 768) {
    document.body.classList.add('small-screen');
    document.body.classList.remove('larger-screen');
  } else {
    document.body.classList.remove('small-screen');
    document.body.classList.add('larger-screen');
  }
}

const App: React.FC = () => {
  useEffect(() => {
    document.addEventListener(REPORT_FULL_WIDTH, () => {
      document.body.classList.add(REPORT_FULL_WIDTH);
      document.body.classList.remove(REPORT_NARROW_WIDTH);
    });
    document.addEventListener(REPORT_NARROW_WIDTH, () => {
      document.body.classList.remove(REPORT_FULL_WIDTH);
      document.body.classList.add(REPORT_NARROW_WIDTH);
    });

    window.addEventListener('resize', setScreenSizeClass);
    setScreenSizeClass();
  }, []);

  return (
    <>
      <Toolbar />
      <div className='map-panel-container'>
        <MapWithTooltips>
          <Map />
        </MapWithTooltips>
        <Panel >
          <FeatureTable />
        </Panel>
      </div>
    </>
  );
}

export default App;

