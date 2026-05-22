import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { NotesPanel } from './components/NotesPanel';
import { TopBar } from './components/TopBar';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <TopBar onMenuToggle={() => setSidebarOpen((o) => !o)} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Overlay sombre derrière la sidebar sur mobile : ferme en cliquant à côté. */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <WorkspaceSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <Routes>
          <Route path="/" element={<NotesPanel />} />
          <Route path="/workspaces/:workspaceId" element={<NotesPanel />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;