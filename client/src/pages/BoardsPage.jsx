import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, deleteBoard, updateBoard } from '../api/boardsApi';

export default function BoardsPage() {
    const [title, setTitle] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: boards, isLoading } = useQuery({ queryKey: ['boards'], queryFn: getBoards });

    const mutation = useMutation({
        mutationFn: createBoard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            setTitle('');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBoard,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] })
    });

    const updateMutation = useMutation({
        mutationFn: (data) => updateBoard(data.id, { title: data.title, version: data.version }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] })
    });

    const handleCreate = (e) => {
        e.preventDefault();
        if (title.trim()) mutation.mutate({ title });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</h2>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Мои доски</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/profile')} className="btn-glass">Профиль</button>
                    <button onClick={handleLogout} className="btn-glass">Выйти</button>
                </div>
            </div>

            <form onSubmit={handleCreate} className="glass" style={{ display: 'flex', gap: '15px', padding: '20px', marginBottom: '40px' }}>
                <input 
                    type="text" 
                    placeholder="Название новой доски..." 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="input-glass"
                    style={{ flexGrow: 1, fontSize: '16px' }}
                />
                <button type="submit" disabled={mutation.isPending} className="btn-primary">
                    {mutation.isPending ? '...' : 'Создать'}
                </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>
                {boards?.length === 0 && <p style={{ fontSize: '18px', opacity: 0.8 }}>У вас пока нет досок. Создайте первую!</p>}
                {boards?.map((board) => (
                    <div 
                        key={board.id} 
                        className="glass"
                        style={{ 
                            width: '280px', 
                            height: '160px', 
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        onClick={() => navigate(`/boards/${board.id}`)}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px' }}>{board.title}</h3>
                            <span style={{ fontSize: '12px', opacity: 0.8, background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '10px' }}>
                                {board.role === 'owner' ? 'Владелец' : board.role === 'editor' ? 'Редактор' : 'Читатель'}
                            </span>
                        </div>
                        
                        {board.role === 'owner' && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => {
                                    const newTitle = prompt('Введите новое название:', board.title);
                                    if (newTitle) updateMutation.mutate({ id: board.id, title: newTitle, version: board.version });
                                }} className="btn-glass" style={{ fontSize: '12px', padding: '5px 10px' }}>Изменить</button>
                                <button onClick={() => {
                                    if (confirm('Удалить доску?')) deleteMutation.mutate(board.id);
                                }} className="btn-glass" style={{ fontSize: '12px', padding: '5px 10px', color: '#ffcccc', borderColor: 'rgba(255,0,0,0.3)' }}>Удалить</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}