import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';

export default function LoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token); // СОХРАНЯЕМ ТОКЕН!
            navigate('/boards'); // Идем к доскам
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ login, password });
    };

    return (
        <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center' }}>
            <h2>Вход</h2>
            {mutation.isError && (
                <p style={{ color: 'red' }}>
                    Ошибка: {mutation.error.response?.data?.error || 'Неверный логин или пароль'}
                </p>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Логин" 
                    value={login} 
                    onChange={(e) => setLogin(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Пароль" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Загрузка...' : 'Войти'}
                </button>
            </form>
            <p style={{ marginTop: '10px' }}>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </div>
    );
}