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
            if (error.response?.status === 409) {
                alert('Конфликт! Карточка была изменена другим пользователем.');
            } else if (error.response?.status === 403) {
                alert('У вас нет прав на редактирование (вы читатель).');
            } else {
                alert('Ошибка сохранения: ' + (error.response?.data?.error || ''));
            }
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: '20px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' }} />
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Закрыть</button>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Исполнители:</b></label><br/>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {Array.isArray(members) && members.map(m => (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={assigneeIds.includes(m.id)} 
                                    onChange={() => toggleAssignee(m.id)} 
                                />
                                <img src={m.avatar_url || 'https://via.placeholder.com/20'} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="avatar" />
                                {m.login}
                            </label>
                        ))}
                        {Array.isArray(members) && members.length === 0 && <p>Нет участников на доске</p>}
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Дедлайн:</b></label><br/>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '5px', marginTop: '5px' }} />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Описание:</b></label><br/>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" style={{ width: '100%', padding: '5px', marginTop: '5px' }} />
                </div>

                <button onClick={handleSave} style={{ marginTop: '20px', padding: '10px 20px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Сохранить</button>

                <hr style={{ margin: '20px 0' }} />

                <h3>Комментарии</h3>
                {Array.isArray(comments) && comments.map(c => (
                    <div key={c.id} style={{ backgroundColor: '#f4f5f7', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <b style={{ fontSize: '14px' }}>{c.author_login || 'Пользователь'}</b>
                            <button onClick={() => deleteCommentMutation.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '12px' }}>Удалить</button>
                        </div>
                        <p style={{ margin: '5px 0 0 0' }}>{c.text}</p>
                    </div>
                ))}

                <form onSubmit={(e) => { e.preventDefault(); if(newComment.trim()) addCommentMutation.mutate(newComment); }} style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Напишите комментарий..." style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <button type="submit" style={{ padding: '8px 15px', background: '#5aac44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Отправить</button>
                </form>
            </div>
        </div>
    );
}