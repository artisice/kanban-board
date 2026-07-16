import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableCard({ card, onEdit }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `card-${card.id}`, data: { type: 'card', card } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="glass-card" 
            {...attributes} 
            {...listeners}
        >
            <div style={{ padding: '12px', color: 'white' }}>
                {card.title}
                
                {card.assignees && card.assignees.length > 0 && (
                    <div style={{ display: 'flex', marginTop: '10px', alignItems: 'center' }}>
                        {card.assignees.map(a => (
                            <img 
                                key={a.id} 
                                src={a.avatar_url || 'https://via.placeholder.com/30'} 
                                title={a.login} 
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '50%', 
                                    border: '2px solid rgba(255,255,255,0.5)', 
                                    marginRight: '-8px',
                                    objectFit: 'cover',
                                }} 
                                alt="avatar" 
                            />
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(card); }} 
                        style={{ cursor: 'pointer', fontSize: '12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0 }}
                    >
                        Изменить
                    </button>
                </div>
            </div>
        </div>
    );
}