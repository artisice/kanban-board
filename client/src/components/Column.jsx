import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCard, deleteColumn, updateColumn } from '../api/boardsApi';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';

export default function Column({ column, cards, boardId, onEditCard }) {
    const queryClient = useQueryClient();
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');

    const { setNodeRef: setColumnRef } = useDroppable({
        id: `col-${column.id}`,
        data: { type: 'column', columnId: column.id }
    });

    const addCardMutation = useMutation({
        mutationFn: (title) => createCard(column.id, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            setNewCardTitle('');
            setIsAddingCard(false);
        }
    });

    const deleteColMutation = useMutation({
        mutationFn: () => deleteColumn(column.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const updateColMutation = useMutation({
        mutationFn: (data) => updateColumn(column.id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const handleAddCard = (e) => {
        e.preventDefault();
        if (newCardTitle.trim()) addCardMutation.mutate(newCardTitle);
    };

    return (
        <div className="glass" style={{ width: '300px', minHeight: '450px', padding: '15px', marginRight: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{column.title}</h3>
                <div>
                    <button onClick={() => {
                        const newTitle = prompt('Переименовать колонку:', column.title);
                        if (newTitle) updateColMutation.mutate({ title: newTitle, version: column.version });
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Изменить</button>
                    <button onClick={() => {
                        if (confirm('Удалить колонку?')) deleteColMutation.mutate();
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#ff9999' }}>Удалить</button>
                </div>
            </div>

            <div ref={setColumnRef} style={{ flexGrow: 1, minHeight: '50px' }}>
                <SortableContext items={cards.map(c => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
                    {cards.map(card => (
                        <div style={{ marginBottom: '10px' }}>
                            <SortableCard key={card.id} card={card} onEdit={onEditCard} />
                        </div>
                    ))}
                </SortableContext>
            </div>

            {isAddingCard ? (
                <form onSubmit={handleAddCard} style={{ marginTop: '10px' }}>
                    <input
                        autoFocus
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Заголовок карточки..."
                        className="input-glass"
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '14px' }}>Добавить</button>
                        <button type="button" onClick={() => setIsAddingCard(false)} className="btn-glass" style={{ padding: '8px 12px', fontSize: '14px' }}>Отмена</button>
                    </div>
                </form>
            ) : (
                <button 
                    onClick={() => setIsAddingCard(true)} 
                    className="btn-glass"
                    style={{ width: '100%', textAlign: 'left', padding: '10px', fontSize: '14px' }}
                >
                    + Добавить карточку
                </button>
            )}
        </div>
    );
}