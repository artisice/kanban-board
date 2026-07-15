import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvite } from '../api/userApi';

export default function AcceptInvitePage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const accept = async () => {
            try {
                const res = await acceptInvite(token);
                alert('Приглашение принято!');
                navigate(`/boards/${res.board_id}`);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        };
        accept();
    }, [token, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>{error ? `Ошибка: ${error}` : 'Принимаем приглашение...'}</h2>
            {!error && <p>Пожалуйста, подождите.</p>}
        </div>
    );
}