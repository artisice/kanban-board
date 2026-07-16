import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/authApi';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const mutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            alert('Регистрация успешна! Войдите.');
            navigate('/login');
        },
        onError: (error) => {
            const msg = error.response?.data?.error || 'Ошибка сервера';
            setErrors({ server: msg });
        }
    });

    const validate = () => {
        const tempErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

        if (!emailRegex.test(email)) {
            tempErrors.email = 'Введите корректный Email';
        }
        if (!passRegex.test(password)) {
            tempErrors.password = 'Минимум 6 символов (буквы и цифры)';
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            mutation.mutate({ login: email, password });
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <div className="glass" style={{ padding: '30px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Регистрация</h2>
                
                {errors.server && <p style={{ color: '#ff9999', textAlign: 'center', marginBottom: '15px' }}>{errors.server}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="input-glass"
                            style={{ width: '100%' }}
                        />
                        {errors.email && <span style={{ color: '#ff9999', fontSize: '12px' }}>{errors.email}</span>}
                    </div>
                    
                    <div>
                        <input 
                            type="password" 
                            placeholder="Пароль" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="input-glass"
                            style={{ width: '100%' }}
                        />
                        {errors.password && <span style={{ color: '#ff9999', fontSize: '12px' }}>{errors.password}</span>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={mutation.isPending} 
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        {mutation.isPending ? 'Загрузка...' : 'Зарегистрироваться'}
                    </button>
                </form>
                
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', opacity: 0.8 }}>
                    Есть аккаунт? <Link to="/login" style={{ color: '#4dabf7' }}>Войти</Link>
                </p>
            </div>
        </div>
    );
}