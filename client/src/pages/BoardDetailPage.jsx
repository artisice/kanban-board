import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoardById, updateCard, createColumn } from '../api/boardsApi';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import Column from '../components/Column';
import CardModal from '../components/CardModal';
import MembersModal from '../components/MembersModal';
import AuditLogModal from '../components/AuditLogModal';
import { socket } from '../api/socket';

export default function BoardDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeCard, setActiveCard] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showMembers, setShowMembers] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const { data: board, isLoading } = useQuery({
        queryKey: ['board', id],
        queryFn: () => getBoardById(id),
    });

    const updateCardMutation = useMutation({
        mutationFn: (data) => updateCard(data.id, data.body),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['board', id] });
            const previousBoard = queryClient.getQueryData(['board', id]);
            queryClient.setQueryData(['board', id], (oldBoard) => {
                if (!oldBoard) return oldBoard;
                const newBoard = JSON.parse(JSON.stringify(oldBoard));
                let movedCard = null;
                for (let col of newBoard.columns) {
                    const idx = col.cards.findIndex(c => c.id == variables.id);
                    if (idx !== -1) { movedCard = col.cards.splice(idx, 1)[0]; break; }
                }
                if (movedCard) {
                    movedCard.column_id = parseInt(variables.body.column_id);
                    movedCard.position = variables.body.position;
                    const targetCol = newBoard.columns.find(c => c.id == variables.body.column_id);
                    if (targetCol) {
                        targetCol.cards.push(movedCard);
                        targetCol.cards.sort((a, b) => a.position - b.position);
                    }
                }
                return newBoard;
            });
            return { previousBoard };
        },
        onError: (error, variables, context) => {
            queryClient.setQueryData(['board', id], context.previousBoard);
            if (error.response?.status === 409) alert('Конфликт! Карточка была изменена другим пользователем.');
            else alert('Ошибка при перемещении');
            queryClient.invalidateQueries({ queryKey: ['board', id] });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['board', id] })
    });

    const addColumnMutation = useMutation({
        mutationFn: (title) => createColumn(id, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', id] });
            setNewColumnTitle('');
            setIsAddingColumn(false);
        }
    });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event) => {
        if (event.active.data.current?.type === 'card') setActiveCard(event.active.data.current.card);
    };

    const handleDragEnd = (event) => {
        setActiveCard(null);
        const { active, over } = event;
        if (!over) return;

        const activeCardId = active.id.toString().replace('card-', '');
        const overId = over.id.toString();

        let activeCardData;
        for (const col of board.columns) {
            const found = col.cards.find(c => c.id == activeCardId);
            if (found) { activeCardData = { ...found, colId: col.id }; break; }
        }
        if (!activeCardData) return;

        let newColumnId = null;
        let newPosition = 1;

        if (overId.startsWith('col-')) {
            newColumnId = overId.replace('col-', '');
            const targetCol = board.columns.find(c => c.id == newColumnId);
            newPosition = targetCol.cards.length > 0 ? Math.max(...targetCol.cards.map(c => c.position)) + 1 : 1;
        } else if (overId.startsWith('card-')) {
            const overCardId = overId.replace('card-', '');
            if (activeCardId === overCardId) return;
            let overCardData;
            for (const col of board.columns) {
                const found = col.cards.find(c => c.id == overCardId);
                if (found) { overCardData = { ...found, colId: col.id }; break; }
            }
            if (!overCardData) return;
            newColumnId = overCardData.colId;
            newPosition = overCardData.position;
        }

        if (newColumnId == activeCardData.colId && newPosition == activeCardData.position) return;

        updateCardMutation.mutate({
            id: activeCardId,
            body: { column_id: newColumnId, position: newPosition, version: activeCardData.version }
        });
    };

    useEffect(() => {
        if (!id) return;
        socket.emit('join_board', id);
        const handleCardUpdate = (updatedCard) => {
            queryClient.setQueryData(['board', id], (oldBoard) => {
                if (!oldBoard) return oldBoard;
                const newBoard = JSON.parse(JSON.stringify(oldBoard));
                for (let col of newBoard.columns) {
                    let idx = col.cards.findIndex(c => c.id == updatedCard.id);
                    if (idx !== -1) col.cards.splice(idx, 1);
                }
                const targetCol = newBoard.columns.find(c => c.id == updatedCard.column_id);
                if (targetCol) {
                    targetCol.cards.push(updatedCard);
                    targetCol.cards.sort((a, b) => a.position - b.position);
                }
                return newBoard;
            });
        };
        socket.on('card_updated', handleCardUpdate);
        return () => socket.off('card_updated', handleCardUpdate);
    }, [id, queryClient]);

    if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка доски...</h2>;
    if (!board) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Доска не найдена</h2>;

    return (
        <div style={{ height: '100vh', padding: '20px', overflowY: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 10px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{board.title}</h1>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowMembers(true)} className="btn-glass">Участники</button>
                    <button onClick={() => setShowLogs(true)} className="btn-glass">История</button>
                    <button onClick={() => navigate('/boards')} className="btn-glass">Назад</button>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} dropAnimation={null}>
                <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: '10px' }}>
                    {board.columns.map(col => (
                        <Column key={col.id} column={col} cards={col.cards} boardId={id} onEditCard={setSelectedCard} />
                    ))}

                    <div style={{ width: '300px' }}>
                        {isAddingColumn ? (
                            <form onSubmit={(e) => { e.preventDefault(); if(newColumnTitle.trim()) addColumnMutation.mutate(newColumnTitle); }} className="glass" style={{ padding: '15px' }}>
                                <input autoFocus type="text" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Заголовок колонки..." className="input-glass" style={{ width: '100%', marginBottom: '10px' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '14px' }}>Добавить</button>
                                    <button type="button" onClick={() => setIsAddingColumn(false)} className="btn-glass" style={{ padding: '8px 12px', fontSize: '14px' }}>Отмена</button>
                                </div>
                            </form>
                        ) : (
                            <button onClick={() => setIsAddingColumn(true)} className="btn-glass" style={{ width: '100%', padding: '15px', fontSize: '16px' }}>
                                + Добавить колонку
                            </button>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeCard ? (
                        <div className="glass-card" style={{ padding: '12px', color: 'white', opacity: 0.8 }}>
                            {activeCard.title}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {selectedCard && <CardModal card={selectedCard} boardId={id} onClose={() => setSelectedCard(null)} />}
            {showMembers && <MembersModal boardId={id} onClose={() => setShowMembers(false)} />}
            {showLogs && <AuditLogModal boardId={id} onClose={() => setShowLogs(false)} />}
        </div>
    );
}