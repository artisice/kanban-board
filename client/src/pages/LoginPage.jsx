import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            navigate('/boards');
        },
        onError: (error) => {
            const msg = error.response?.data?.error || 'Ошибка сервера';
            setErrors({ server: msg });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setErrors({ server: 'Заполните все поля' });
            return;
        }
        mutation.mutate({ login: email, password });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <div className="glass" style={{ padding: '30px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Вход</h2>
                
                {errors.server && <p style={{ color: '#ff9999', textAlign: 'center', marginBottom: '15px' }}>{errors.server}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="input-glass"
                        style={{ width: '100%' }}
                        required
                    />
                    
                    <input 
                        type="password" 
                        placeholder="Пароль" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="input-glass"
                        style={{ width: '100%' }}
                        required
                    />

                    <button 
                        type="submit" 
                        disabled={mutation.isPending} 
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        {mutation.isPending ? 'Загрузка...' : 'Войти'}
                    </button>
                </form>
                
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', opacity: 0.8 }}>
                    Нет аккаунта? <Link to="/register" style={{ color: '#4dabf7' }}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}