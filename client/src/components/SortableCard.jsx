// client/src/components/SortableCard.jsx
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
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {card.title}
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(card); }} 
                style={{ cursor: 'pointer', fontSize: '12px', background: 'transparent', border: 'none', color: '#5e6c84' }}
            >
                Изменить
            </button>
        </div>
    );
}