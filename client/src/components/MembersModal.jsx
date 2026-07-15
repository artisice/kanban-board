import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, generateInviteLink, updateMemberRole, getMe } from '../api/userApi';
import { useState } from 'react';

export default function MembersModal({ boardId, onClose }) {
    const queryClient = useQueryClient();
    const [inviteLink, setInviteLink] = useState('');

    const { data: members, isLoading } = useQuery({ 
        queryKey: ['members', boardId], 
        queryFn: () => getMembers(boardId) 
    });

    const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

    const myMemberInfo = Array.isArray(members) && me ? members.find(m => m.id === me.id) : null;
    const isOwner = myMemberInfo?.role === 'owner';

    const inviteMutation = useMutation({
        mutationFn: (role) => generateInviteLink(boardId, role),
        onSuccess: (data) => setInviteLink(data),
        onError: (error) => alert(error.response?.data?.error || 'Нет прав на генерацию ссылки')
    });

    const roleMutation = useMutation({
        mutationFn: (data) => updateMemberRole(boardId, data.userId, data.role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', boardId] })
    });

    const translateRole = (role) => {
        if (role === 'owner') return 'Владелец';
        if (role === 'editor') return 'Редактор';
        return 'Читатель';
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px', color: '#333' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Участники</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Закрыть</button>
                </div>

                {isLoading ? <p>Загрузка...</p> : (
                    Array.isArray(members) && members.length > 0 ? members.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', padding: '5px', borderBottom: '1px solid #eee' }}>
                            <img src={m.avatar_url || 'https://via.placeholder.com/30'} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="avatar" />
                            <span>{m.login}</span>
                            
                            <div style={{ marginLeft: 'auto' }}>
                                {isOwner ? (
                                    // Владелец видит выпадающий список
                                    <select 
                                        value={m.role} 
                                        onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value })}
                                        style={{ padding: '5px' }}
                                    >
                                        <option value="owner">Владелец</option>
                                        <option value="editor">Редактор</option>
                                        <option value="viewer">Читатель</option>
                                    </select>
                                ) : (
                                    // Не владелец видит просто текст
                                    <span style={{ color: '#666', fontSize: '14px' }}>
                                        {translateRole(m.role)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )) : <p>Нет участников или ошибка загрузки</p>
                )}

                {isOwner && (
                    <>
                        <hr style={{ margin: '20px 0' }} />
                        <h3>Пригласить по ссылке</h3>
                        <button 
                            onClick={() => inviteMutation.mutate('viewer')} 
                            disabled={inviteMutation.isPending}
                            style={{ padding: '8px 15px', cursor: 'pointer', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {inviteMutation.isPending ? 'Генерация...' : 'Сгенерировать ссылку (Читатель)'}
                        </button>
                        
                        {inviteLink && (
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    value={inviteLink} 
                                    readOnly 
                                    style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} 
                                />
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Скопировано!'); }} 
                                    style={{ padding: '5px 10px', cursor: 'pointer' }}
                                >
                                    Копировать
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}