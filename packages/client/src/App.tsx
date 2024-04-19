import React, { useEffect, useRef, useState } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import Map from './components/Map';
import ResultsPanel from './components/ResultsPanel';
import Toolbar from './components/Toolbar';
import Modal from './components/Modal';
import About from './views/About';
import Contact from './views/Contact';
import Histogram from './components/Histogram';
import SightingDetails from './views/SightingDetails';
import OpenReport from './components/OpenReport';

import './App.css';

export const REPORT_FULL_WIDTH = 'REPORT_FULL_WIDTH';
export const REPORT_NARROW_WIDTH = 'REPORT_NARROW_WIDTH';

function setScreenSizeClass() {
  if (window.innerWidth < 768) {
    document.body.classList.add('SMALL-SCREEN');
    document.body.classList.remove('LARGER-SCREEN');
  } else {
    document.body.classList.remove('SMALL-SCREEN');
    document.body.classList.add('LARGER-SCREEN');
  }
}

const App: React.FC = () => {
  const appElementRef = useRef<HTMLDivElement>(null);
  const [appClasses, setAppClasses] = useState('');
  const { panel } = useSelector((state: RootState) => state.gui);
  const { requestingFeatures } = useSelector((state: RootState) => state.map);

  useEffect(() => {
    window.addEventListener('resize', setScreenSizeClass);
    setScreenSizeClass();
    return () => window.removeEventListener('resize', setScreenSizeClass);
  }, []);

  useEffect(() => {
    if (requestingFeatures) {
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
    }
  }, [requestingFeatures]);

  useEffect(() => {
    let widthClass = '';
    if (panel === 'full') {
      widthClass = REPORT_FULL_WIDTH;
    } else if (panel === 'narrow') {
      widthClass = REPORT_NARROW_WIDTH;
    }
    setAppClasses(widthClass + ' panel-is-' + panel);
  }, [panel])

  return (
    <main ref={appElementRef} className={appClasses}>
      <BrowserRouter>
        <>
          <Routes>
            <Route path="/about" element={<Modal><About /></Modal>} />
            <Route path="/contact" element={<Modal><Contact /></Modal>} />
            <Route path="/sighting/:id" element={<SightingDetails />} />
            <Route path="/histogram/dates" element={<Histogram />} />
            <Route path="/report" element={<OpenReport />} />
            <Route path="/" element={<span />} />{/* noop */}
          </Routes>

          <Toolbar />

          <section id='map-panel-container'>
            <Map />
            <ResultsPanel />
          </section>
        </>
      </BrowserRouter>
    </main>
  );
}

export default App;

