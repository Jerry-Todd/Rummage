import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Viewer from "./pages/viewer";
import Layout from "./pages/layout";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <Routes>
      {/* Main application routes */}
      <Route path="/" element={<Layout title="Storage Usage"><Viewer /></Layout>} />
      {/* Catch unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
