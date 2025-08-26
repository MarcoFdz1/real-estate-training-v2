import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import TestPage from "./TestPage";

// Check if we want to test API directly
const isTest = window.location.hash === '#test';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {isTest ? <TestPage /> : <App />}
  </React.StrictMode>,
);
