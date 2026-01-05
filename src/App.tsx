import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import ClientAlbumViewPage from './pages/ClientAlbumViewPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Public Routes */}
        <Route path="/albums/code/:code" element={<ClientAlbumViewPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
