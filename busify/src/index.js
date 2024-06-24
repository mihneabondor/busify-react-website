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
  Navigate
} from "react-router-dom";
import Orare from './Orare/Orare';
import Orar from './Orare/Orar';
import Traseu from './Orare/Traseu';

const root = ReactDOM.createRoot(document.getElementById('root'));
const fetchData = async () => {
  try {
    const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
    const buses_basic = await resp.json();
    const sol = []
    const joinArray = (arr) => {
      arr.forEach(elem => {
        sol.push(elem)
      })
    }
    joinArray(buses_basic.urbane)
    joinArray(buses_basic.metropolitane)
    joinArray(buses_basic.market)
    // return sol
    root.render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<App />}
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
            path='/orar/:linie'
            element={<Orar />}
          />
          <Route
            path='/orar/:linie/traseu'
            element={<Traseu />}
          />
        </Routes>
      </BrowserRouter>
    );
  } catch (err) {
    console.log(err)
  }
}

root.render(
  <div>Se incarca...</div>
)
fetchData();
