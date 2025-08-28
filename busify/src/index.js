import React from "react";
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Map from './Map/Map';
import Orare from './Orare/Orare';
import Orar from './Orare/Orar';
import AppStoreRedirects from './AppStoreRedirects';
import FileViewer from "./FileViewer";
import Favorite from "./Orare/Favorite";
import Stiri from "./Stiri/Stiri";
import Settings from "./Settings/Settings";
import PanouDisplayLinii from "./PanouDisplayLinii/PanouDisplayLinii";
import Onboarding from "./Onboarding/Onboarding";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/map" element={<Map />} />
        <Route path="/harta" element={<Map />} />
        <Route path="/map/:undemibusu" element={<Map />} />
        <Route path="/orare" element={<Orare />} />
        <Route path="/orare/:linie" element={<Orar />} />
        <Route path="/favorite/:linie" element={<Orar />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route path="/storeredirect" element={<AppStoreRedirects />} />
        <Route path="/stiri" element={<Stiri />} />
        <Route path="/setari" element={<Settings />} />
        <Route path="/setari/panou-linii" element={<PanouDisplayLinii />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path='/.well-known/assetlinks.json' element={<FileViewer filePath="../public/assetlinks.json" />} />
        <Route path="*" element={<Map />} />
      </Routes>
    </BrowserRouter>
);
