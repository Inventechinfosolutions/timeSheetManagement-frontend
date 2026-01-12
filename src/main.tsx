import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.tsx";
import setupAxiosInterceptors from "./config/axios-interceptor";
import "./index.css";

setupAxiosInterceptors(() => {
  window.location.href = "/login";
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
