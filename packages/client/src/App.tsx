import React, { useEffect } from 'react';

import { addReportEvents, removeReportEvents } from './custom-events/report-width';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import FeatureTable from './FeaturesTable';
import Map from './Map';
import Panel from './ResultsPanel';
import Toolbar from './Toolbar';
import Modal from './Modal';
import About from './Modal/About';
import Contact from './Modal/Contact';

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
    addReportEvents();
    setScreenSizeClass();

    return () => {
      removeReportEvents();
      window.removeEventListener('resize', setScreenSizeClass);
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <>
          <Modal>
            <Routes>
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              {/* <Route path="/histogram/dates" element={<Histogram />} /> */}
            </Routes>
          </Modal>

          <Toolbar />
          <div className='map-panel-container'>
            <Map />
            <Panel>
              <FeatureTable />
            </Panel>
          </div>
        </>
      </BrowserRouter>
    </>
  );
}

export default App;

