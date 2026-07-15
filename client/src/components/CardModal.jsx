import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCard, getComments, createComment, deleteComment } from '../api/boardsApi';

export default function CardModal({ card, boardId, onClose }) {
    const queryClient = useQueryClient();
    
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [assignee, setAssignee] = useState(card.assignee_id || '');
    const [deadline, setDeadline] = useState(card.deadline ? card.deadline.substring(0, 10) : '');
    const [newComment, setNewComment] = useState('');

    const { data: comments, isLoading: commentsLoading } = useQuery({
        queryKey: ['comments', card.id],
        queryFn: () => getComments(card.id),
    });

    const updateMutation = useMutation({
        mutationFn: (data) => updateCard(card.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        },
        onError: (error) => {
            if (error.response?.status === 409) {
                alert('Конфликт! Карточка была изменена другим пользователем.');
                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
                onClose();
            }
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', card.id] });
        }
    });

    const handleSave = () => {
        updateMutation.mutate({
            title,
            description,
            assignee_id: assignee || null,
            deadline: deadline || null,
            version: card.version 
        });
        alert('Сохранено!');
        onClose();
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            addCommentMutation.mutate(newComment);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                width: '500px', maxHeight: '80vh', overflowY: 'auto', color: '#333'
            }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: '20px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' }} />
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✖</button>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Исполнитель (ID):</b></label><br/>
                    <input type="number" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="ID пользователя" style={{ width: '100%', padding: '5px', marginTop: '5px' }} />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Дедлайн:</b></label><br/>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '5px', marginTop: '5px' }} />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label><b>Описание:</b></label><br/>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" style={{ width: '100%', padding: '5px', marginTop: '5px' }} />
                </div>

                <button onClick={handleSave} style={{ marginTop: '20px', padding: '10px 20px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Сохранить
                </button>

                <hr style={{ margin: '20px 0' }} />

                <h3>Комментарии</h3>
                {commentsLoading ? <p>Загрузка...</p> : (
                    <div>
                        {comments?.map(c => (
                            <div key={c.id} style={{ backgroundColor: '#f4f5f7', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b style={{ fontSize: '14px' }}>{c.author_login || 'Пользователь'}</b>
                                    <button onClick={() => deleteCommentMutation.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '12px' }}>Удалить</button>
                                </div>
                                <p style={{ margin: '5px 0 0 0' }}>{c.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleAddComment} style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Напишите комментарий..." 
                        style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '8px 15px', background: '#5aac44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Отправить
                    </button>
                </form>
            </div>
        </div>
    );
}