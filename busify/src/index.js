import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import Map from './Map/Map';
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          exact
          path="/"
          element={<App />}
        />
        <Route
          exact
          path="/Map"
          element={<Map />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
