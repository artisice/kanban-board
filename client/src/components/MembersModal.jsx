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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div className="glass-modal" style={{ padding: '30px', width: '450px', color: 'white' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Участники</h2>
                    <button onClick={onClose} className="btn-glass" style={{ padding: '5px 15px' }}>Закрыть</button>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {isLoading ? <p>Загрузка...</p> : (
                        Array.isArray(members) && members.length > 0 ? members.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '10px 0', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <img src={m.avatar_url || 'https://via.placeholder.com/30'} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} alt="avatar" />
                                <span style={{ fontWeight: '500' }}>{m.login}</span>
                                
                                <div style={{ marginLeft: 'auto' }}>
                                    {isOwner ? (
                                        <select 
                                            value={m.role} 
                                            onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value })}
                                            style={{ padding: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', outline: 'none' }}
                                        >
                                            <option value="owner" style={{color: 'black'}}>Владелец</option>
                                            <option value="editor" style={{color: 'black'}}>Редактор</option>
                                            <option value="viewer" style={{color: 'black'}}>Читатель</option>
                                        </select>
                                    ) : (
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '10px' }}>
                                            {translateRole(m.role)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )) : <p>Нет участников или ошибка загрузки</p>
                    )}
                </div>

                {isOwner && (
                    <>
                        <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                        <h3 style={{ marginBottom: '15px' }}>Пригласить по ссылке</h3>
                        <button 
                            onClick={() => inviteMutation.mutate('viewer')} 
                            disabled={inviteMutation.isPending}
                            className="btn-primary"
                            style={{ width: '100%' }}
                        >
                            {inviteMutation.isPending ? 'Генерация...' : 'Сгенерировать ссылку (Читатель)'}
                        </button>
                        
                        {inviteLink && (
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    value={inviteLink} 
                                    readOnly 
                                    className="input-glass"
                                    style={{ flexGrow: 1 }} 
                                />
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Скопировано!'); }} 
                                    className="btn-glass"
                                    style={{ padding: '8px 15px' }}
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