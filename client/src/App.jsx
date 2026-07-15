import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardDetailPage from './pages/BoardDetailPage'; // <-- ДОБАВЛЕН ИМПОРТ

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/boards" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    <Route path="/boards" element={
                        <ProtectedRoute>
                            <BoardsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/boards/:id" element={
                        <ProtectedRoute>
                            <BoardDetailPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;