import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { ProjectProvider } from './hooks/useProjectContext';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
import ProjectEditor from './pages/ProjectEditor/ProjectEditor';
import './App.css';

function App() {
    return (
        <ConfigProvider locale={ruRU}>
            <ProjectProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<ProjectsPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:projectId" element={<ProjectEditor />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ProjectProvider>
        </ConfigProvider>
    );
}

export default App;