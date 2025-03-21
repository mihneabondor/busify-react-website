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
import Orare from './Orare/Orare';
import Orar from './Orare/Orar';
import AppStoreRedirects from './AppStoreRedirects';
import FileViewer from "./FileViewer";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={<Map />}
      />
      <Route
        path="/map"
        element={<Map />}
      />
      <Route
        path="/harta"
        element={<Map />}
      />
      <Route
        path="/map/:undemibusu"
        element={<Map />}
      />
      <Route
        path="/orare"
        element={<Orare />}
      />
      <Route
        path='/orare/:linie'
        element={<Orar />}
      />
      <Route
        path='/storeredirect'
        element={<AppStoreRedirects />}
      />
      <Route
          path='/.well-known/assetlinks.json'
          element={<FileViewer filePath="../public/assetlinks.json" />}
      />
      <Route path='*' element={<Map/>}/>
    </Routes>
  </BrowserRouter>
);
