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
        opacity: isDragging ? 0 : 1,
        padding: '10px',
        margin: '5px 0',
        backgroundColor: 'white',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        cursor: 'grab',
        color: '#333',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div>{card.title}</div>
            
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
                                border: '2px solid white', 
                                marginRight: '-8px',
                                objectFit: 'cover',
                                zIndex: 1
                            }} 
                            alt="avatar" 
                        />
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(card); }} 
                    style={{ cursor: 'pointer', fontSize: '12px', background: 'transparent', border: 'none', color: '#5e6c84', padding: 0 }}
                >
                    Изменить
                </button>
            </div>
        </div>
    );
}