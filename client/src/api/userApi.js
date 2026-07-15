import api from './axios';

export const getMe = async () => {
    const response = await api.get('/me');
    return response.data;
};

export const updateMe = async (data) => {
    const response = await api.put('/me', data);
    return response.data;
};

export const getMembers = async (boardId) => {
    const response = await api.get(`/boards/${boardId}/members`);
    return response.data;
};

export const generateInviteLink = async (boardId, role) => {
    const response = await api.post(`/boards/${boardId}/invite-link`, { role });
    const data = response.data;
    if (typeof data === 'string') return data;
    if (data && typeof data.link === 'string') return data.link;
    return 'Ошибка: ссылка не сгенерирована';
};

export const acceptInvite = async (token) => {
    const response = await api.post('/invitations/accept', { token });
    return response.data;
};

export const updateMemberRole = async (boardId, userId, role) => {
    const response = await api.put(`/boards/${boardId}/members`, { user_id: userId, role });
    return response.data;
};