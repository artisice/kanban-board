import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '../api/userApi';
import { useState } from 'react';

export default function ProfilePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
    const [avatarUrl, setAvatarUrl] = useState('');

    const mutation = useMutation({
        mutationFn: updateMe,
        onSuccess: () => {
            alert('Аватарка обновлена!');
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });

    if (isLoading) return <h2>Загрузка...</h2>;

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Профиль</h2>
            <img 
                src={user.avatar_url || 'https://via.placeholder.com/100'} 
                alt="Avatar" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <p>Логин: <b>{user.login}</b></p>
            
            <div style={{ marginTop: '20px' }}>
                <input 
                    type="text" 
                    placeholder="Вставьте URL картинки" 
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)} 
                    style={{ width: '100%', padding: '8px' }}
                />
                <button 
                    onClick={() => mutation.mutate({ avatar_url: avatarUrl })} 
                    style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}
                >
                    Сохранить аватар
                </button>
            </div>
            <button onClick={() => navigate('/boards')} style={{ marginTop: '30px', padding: '8px 15px' }}>Назад</button>
        </div>
    );
}