// client/src/components/Column.jsx
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
        <div style={{
            backgroundColor: '#ebecf0', borderRadius: '8px', width: '280px',
            minHeight: '400px', padding: '10px', marginRight: '15px',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 10px' }}>
                <h3 style={{ fontSize: '16px', color: '#333', margin: 0 }}>{column.title}</h3>
                <div>
                    <button onClick={() => {
                        const newTitle = prompt('Переименовать колонку:', column.title);
                        if (newTitle) updateColMutation.mutate({ title: newTitle, version: column.version });
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Изменить</button>
                    <button onClick={() => {
                        if (confirm('Удалить колонку со всеми карточками?')) deleteColMutation.mutate();
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'red' }}>Удалить</button>
                </div>
            </div>

            <div ref={setColumnRef} style={{ flexGrow: 1, minHeight: '50px' }}>
                <SortableContext items={cards.map(c => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
                    {cards.map(card => (
                        <SortableCard key={card.id} card={card} onEdit={onEditCard} />
                    ))}
                </SortableContext>
            </div>

            {isAddingCard ? (
                <form onSubmit={handleAddCard} style={{ marginTop: '10px' }}>
                    <input
                        autoFocus type="text" value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Введите заголовок..."
                        style={{ width: '90%', padding: '8px', borderRadius: '4px', border: 'none', marginBottom: '5px' }}
                    />
                    <div>
                        <button type="submit" style={{ padding: '6px 12px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Добавить</button>
                        <button type="button" onClick={() => setIsAddingCard(false)} style={{ padding: '6px 12px', background: 'transparent', color: '#333', border: 'none', cursor: 'pointer' }}>Отмена</button>
                    </div>
                </form>
            ) : (
                <button onClick={() => setIsAddingCard(true)} style={{ textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#5e6c84', cursor: 'pointer', borderRadius: '4px' }}>
                    + Добавить карточку
                </button>
            )}
        </div>
    );
}