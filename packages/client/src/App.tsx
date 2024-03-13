import React from 'react'; 

import './App.css';
import OpenLayersMap from './Map';

const App: React.FC = () => {
  return (
    <div>
      <h1>Map</h1>
      <OpenLayersMap />
    </div>
  );
}

export default App;
