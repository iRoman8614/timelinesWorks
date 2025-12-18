import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { ProjectProvider } from './hooks/useProjectContext';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';

function App() {
    return (
        <ConfigProvider locale={ruRU}>
            <ProjectProvider>
                <Router basename="/optimizer">
                    <Routes>
                        <Route path="/" element={<ProjectsPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ProjectProvider>
        </ConfigProvider>
    );
}

export default App;