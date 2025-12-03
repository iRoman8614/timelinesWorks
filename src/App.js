import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import ProjectNavigatorPage from './pages/ProjectNavigatorPage';
import ProjectWorkspacePage from './pages/ProjectWorkspacePage';
import './App.css';

function App() {
  return (
      <ConfigProvider locale={ruRU}>
        <BrowserRouter basename={'/optimizer/'}>
          <Routes>
            <Route path="/" element={<ProjectNavigatorPage />} />
            <Route path="/project/:projectId" element={<ProjectWorkspacePage />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
  );
}

export default App;