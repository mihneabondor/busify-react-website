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
              path="/map"
              element={<Map />}
            />
            <Route
              exact
              path="/orare"
              element={<Orare />}
            />
            {sol.map(elem => (
              <Route
                exact
                path={'/orar/' + elem.name}
                element={<Orar vehicle={elem} />}
              />
            ))}
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    console.log(err)
  }
}

root.render(
  <div>Se incarca...</div>
)
fetchData();
