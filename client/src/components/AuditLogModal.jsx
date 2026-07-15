import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/boardsApi';

export default function AuditLogModal({ boardId, onClose }) {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['logs', boardId],
        queryFn: () => getAuditLogs(boardId)
    });

    const formatDetails = (action, rawDetails) => {
        if (!rawDetails) return '';

        let details = rawDetails;
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
            } catch (e) {
                return '';
            }
        }

        if (action === 'card_updated') {
            if (details.title_changed) return `Изменил название с "${details.title_changed.old || 'пусто'}" на "${details.title_changed.new}"`;
            if (details.description_changed) return `Изменил описание`;
            if (details.card_moved) return `Перенес карточку в другую колонку`;
            if (details.position_changed) return `Изменил порядок (с ${details.position_changed.old} на ${details.position_changed.new})`;
            if (details.deadline_changed) return `Изменил дедлайн`;
            if (details.assignees_added) return `Назначил новых исполнителей`;
            if (details.assignees_removed) return `Убрал исполнителей`;
        }
        
        if (action === 'column_created') return `Создал новую колонку`;
        if (action === 'column_updated') return `Переименовал колонку в "${details.new_title}"`;
        if (action === 'column_deleted') return `Удалил колонку`;

        return '';
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto', color: '#333' }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>История изменений</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Закрыть</button>
                </div>

                {isLoading ? <p>Загрузка...</p> : (
                    Array.isArray(logs) && logs.length > 0 ? logs.map(log => (
                        <div key={log.id} style={{ display: 'flex', gap: '10px', margin: '15px 0', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <img src={log.avatar_url || 'https://via.placeholder.com/30'} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="avatar" />
                            <div>
                                <div style={{ fontSize: '14px' }}>
                                    <b>{log.login}</b>{' '}
                                    {log.action === 'card_created' && `создал карточку "${log.card_title}"`}
                                    {log.action === 'card_deleted' && `удалил карточку "${log.card_title}"`}
                                    {log.action === 'card_updated' && `обновил карточку "${log.card_title}"`}
                                    {log.action === 'column_created' && `создал колонку "${log.card_title}"`}
                                    {log.action === 'column_updated' && `переименовал колонку "${log.card_title}"`}
                                    {log.action === 'column_deleted' && `удалил колонку "${log.card_title}"`}
                                </div>
                                {log.details && (
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        {formatDetails(log.action, log.details)}
                                    </div>
                                )}
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )) : <p>История пуста</p>
                )}
            </div>
        </div>
    );
}