import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCard, getComments, createComment, deleteComment } from '../api/boardsApi';
import { getMembers } from '../api/userApi';

export default function CardModal({ card, boardId, onClose }) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [deadline, setDeadline] = useState(card.deadline ? card.deadline.substring(0, 10) : '');
    const [newComment, setNewComment] = useState('');
    
    const [assigneeIds, setAssigneeIds] = useState(
        Array.isArray(card.assignees) ? card.assignees.map(a => a.id) : []
    );

    const { data: comments } = useQuery({ 
        queryKey: ['comments', card.id], 
        queryFn: () => getComments(card.id) 
    });
    
    const { data: members } = useQuery({ 
        queryKey: ['members', boardId], 
        queryFn: () => getMembers(boardId) 
    });

    const updateMutation = useMutation({
        mutationFn: (data) => updateCard(card.id, data),
        onSuccess: () => {
            alert('Сохранено!');
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            onClose();
        },
        onError: (error) => {
            if (error.response?.status === 409) alert('Конфликт! Карточка была изменена другим пользователем.');
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            onClose();
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: (text) => createComment(card.id, text),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['comments', card.id] }); 
            setNewComment(''); 
        }
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId) => deleteComment(commentId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', card.id] })
    });

    const handleSave = () => {
        updateMutation.mutate({
            title,
            description,
            deadline: deadline || null,
            assignees: assigneeIds, 
            version: card.version
        });
    };

    const toggleAssignee = (userId) => {
        setAssigneeIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div className="glass-modal" style={{ padding: '30px', width: '500px', maxHeight: '80vh', overflowY: 'auto', color: 'white' }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="input-glass" 
                        style={{ fontSize: '20px', fontWeight: 'bold', width: '100%', border: 'none', background: 'transparent' }} 
                    />
                    <button onClick={onClose} className="btn-glass" style={{ marginLeft: '15px' }}>Закрыть</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Исполнители:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {Array.isArray(members) && members.map(m => (
                                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '6px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={assigneeIds.includes(m.id)} 
                                        onChange={() => toggleAssignee(m.id)} 
                                        style={{ accentColor: '#2f80ed' }}
                                    />
                                    <img src={m.avatar_url || 'https://via.placeholder.com/20'} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="avatar" />
                                    <span style={{ fontSize: '14px' }}>{m.login}</span>
                                </label>
                            ))}
                            {Array.isArray(members) && members.length === 0 && <p style={{ fontSize: '14px', opacity: 0.6 }}>Нет участников</p>}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Дедлайн:</label>
                        <input 
                            type="date" 
                            value={deadline} 
                            onChange={(e) => setDeadline(e.target.value)} 
                            className="input-glass" 
                            style={{ width: '100%', colorScheme: 'dark' }} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Описание:</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows="4" 
                            className="input-glass" 
                            style={{ width: '100%', resize: 'vertical' }} 
                        />
                    </div>

                    <button onClick={handleSave} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Сохранить изменения
                    </button>
                </div>

                <hr style={{ margin: '30px 0 20px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Комментарии</h3>
                {Array.isArray(comments) && comments.map(c => (
                    <div key={c.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <b style={{ fontSize: '14px' }}>{c.author_login || 'Пользователь'}</b>
                            <button onClick={() => deleteCommentMutation.mutate(c.id)} className="btn-glass" style={{ padding: '2px 8px', fontSize: '12px', color: '#ff9999' }}>Удалить</button>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{c.text}</p>
                    </div>
                ))}

                <form onSubmit={(e) => { e.preventDefault(); if(newComment.trim()) addCommentMutation.mutate(newComment); }} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Напишите комментарий..." 
                        className="input-glass" 
                        style={{ flexGrow: 1 }} 
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '8px 15px' }}>Отправить</button>
                </form>
            </div>
        </div>
    );
}