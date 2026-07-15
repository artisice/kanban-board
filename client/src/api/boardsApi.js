import api from './axios';

export const getBoards = async () => {
    const response = await api.get('/boards');
    return response.data;
};

export const createBoard = async (boardData) => {
    const response = await api.post('/boards', boardData);
    return response.data;
};

export const getBoardById = async (id) => {
    const response = await api.get(`/boards/${id}`);
    return response.data;
};

export const updateCard = async (cardId, cardData) => {
    const response = await api.put(`/cards/${cardId}`, cardData);
    return response.data;
};

export const createColumn = async (boardId, title) => {
    const response = await api.post(`/boards/${boardId}/columns`, { title });
    return response.data;
};

export const createCard = async (columnId, title) => {
    const response = await api.post(`/columns/${columnId}/cards`, { title });
    return response.data;
};

export const getComments = async (cardId) => {
    const response = await api.get(`/cards/${cardId}/comments`);
    return response.data;
};

export const createComment = async (cardId, text) => {
    const response = await api.post(`/cards/${cardId}/comments`, { text });
    return response.data;
};

export const deleteComment = async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
};

export const deleteBoard = async (id) => {
    await api.delete(`/boards/${id}`);
};

export const updateBoard = async (id, data) => {
    const response = await api.put(`/boards/${id}`, data);
    return response.data;
};

export const deleteColumn = async (id) => {
    await api.delete(`/columns/${id}`);
};

export const updateColumn = async (id, data) => {
    const response = await api.put(`/columns/${id}`, data);
    return response.data;
};

export const inviteUser = async (boardId, login, role) => {
    await api.post(`/boards/${boardId}/invite`, { login, role });
};