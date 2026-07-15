import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, deleteBoard, updateBoard } from '../api/boardsApi';

export default function BoardsPage() {
    const [title, setTitle] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: boards, isLoading } = useQuery({
        queryKey: ['boards'],
        queryFn: getBoards,
    });

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
        if (title.trim()) {
            mutation.mutate({ title });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading) return <h2>Загрузка досок...</h2>;

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Мои доски</h1>
                <button onClick={() => navigate('/profile')} style={{ padding: '5px 15px' }}>Профиль</button>
                <button onClick={handleLogout} style={{ padding: '5px 15px' }}>Выйти</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input 
                    type="text" 
                    placeholder="Название новой доски" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    style={{ flexGrow: 1, padding: '10px' }}
                />
                <button type="submit" disabled={mutation.isPending} style={{ padding: '10px 20px' }}>
                    {mutation.isPending ? 'Создание...' : 'Создать'}
                </button>
            </form>

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
    {boards?.length === 0 && <p>У вас пока нет досок. Создайте первую!</p>}
    {boards?.map((board) => (
        <div 
            key={board.id} 
            style={{ 
                width: '200px', 
                height: '120px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '8px', 
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            <div onClick={() => navigate(`/boards/${board.id}`)} style={{ cursor: 'pointer' }}>
                <h3 style={{ margin: 0 }}>{board.title}</h3>
                <p style={{ fontSize: '12px', color: 'gray', marginTop: '10px' }}>
                    Роль: {board.role === 'owner' ? 'Владелец' : board.role === 'editor' ? 'Редактор' : 'Читатель'}
                </p>
            </div>
            
            {board.role === 'owner' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => {
                        const newTitle = prompt('Введите новое название:', board.title);
                        if (newTitle) updateMutation.mutate({ id: board.id, title: newTitle, version: board.version });
                    }}>Изменить</button>
                    <button onClick={() => {
                        if (confirm('Удалить доску?')) deleteMutation.mutate(board.id);
                    }} style={{ color: 'red' }}>Удалить</button>
                </div>
            )}
        </div>
    ))}
    </div>
</div>
    );
}