import { User, GameHistoryRecord } from '../types';

// API Handling
// If running locally with React dev server, you might need a proxy. 
// For production (served by node), relative path /api works.
const API_BASE = '/api';

export const registerUser = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: '网络请求失败' };
  }
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; user?: User; message: string }> => {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: '网络请求失败' };
  }
};

export const resetPasswordRequest = async (email: string): Promise<{ success: boolean; message: string }> => {
  // Mock implementation for now as we don't have email server
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: '（模拟）重置链接已发送到邮箱' });
    }, 500);
  });
};

export const saveGameRecord = async (username: string, record: GameHistoryRecord) => {
  try {
    await fetch(`${API_BASE}/game/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, record })
    });
  } catch (error) {
    console.error("Failed to save game", error);
  }
};

export const getGameHistory = async (username: string): Promise<GameHistoryRecord[]> => {
  try {
    const res = await fetch(`${API_BASE}/history/${username}`);
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch history", error);
    return [];
  }
};