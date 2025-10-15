import React from "react";
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import {KeepAlive, AliveScope} from "react-activation";
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[SW] registered:', registration);
        })
        .catch(error => {
          console.error('[SW] registration failed:', error);
        });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <AliveScope>
      <Routes>
          <Route path="/" element={<KeepAlive><Map /></KeepAlive>} />
            <Route path="/map" element={<Map/>} />
            <Route path="/harta" element={<KeepAlive><Map /></KeepAlive>} />
            <Route path="/map/:undemibusu" element={<Map/>} />
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
            <Route path="*" element={<KeepAlive><Map /></KeepAlive>} />
      </Routes>
    </AliveScope>
    </BrowserRouter>

);
