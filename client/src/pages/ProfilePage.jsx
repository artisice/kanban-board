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
            setAvatarUrl('');
        }
    });

    if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</h2>;

    return (
        <div style={{ maxWidth: '450px', margin: '80px auto' }}>
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ marginTop: 0, marginBottom: '30px' }}>Профиль</h2>
                
                <img 
                    src={user.avatar_url || 'https://via.placeholder.com/120'} 
                    alt="Avatar" 
                    style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '3px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        marginBottom: '20px'
                    }} 
                />
                
                <div style={{ marginBottom: '30px' }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>Логин (Email)</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '600' }}>{user.login}</p>
                </div>
                
                <div style={{ textAlign: 'left', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={{ fontSize: '14px', opacity: 0.8, display: 'block', marginBottom: '10px' }}>
                        Изменить аватар (URL):
                    </label>
                    <input 
                        type="text" 
                        placeholder="Вставьте ссылку на картинку" 
                        value={avatarUrl} 
                        onChange={(e) => setAvatarUrl(e.target.value)} 
                        className="input-glass"
                        style={{ width: '100%', marginBottom: '15px' }}
                    />
                    <button 
                        onClick={() => mutation.mutate({ avatar_url: avatarUrl })} 
                        className="btn-primary"
                        disabled={!avatarUrl.trim()}
                        style={{ width: '100%' }}
                    >
                        {mutation.isPending ? 'Сохранение...' : 'Сохранить аватар'}
                    </button>
                </div>

                <button 
                    onClick={() => navigate('/boards')} 
                    className="btn-glass"
                    style={{ marginTop: '30px', width: '100%' }}
                >
                    Назад к доскам
                </button>
            </div>
        </div>
    );
}