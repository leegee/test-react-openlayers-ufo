import React from 'react'; // eslint-disable-line no-unused-vars

// import { Provider } from 'react-redux';
import './App.css';
import OpenLayersMap from './Map';

function App() {
  return (
    // <Provider> 
      <div>
        <h1>Map</h1> 
        <OpenLayersMap /> 
      </div>
    // </Provider>
  );
}

export default App;
