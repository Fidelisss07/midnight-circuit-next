'use client';
import { useEffect, useRef } from 'react';

// Global toast function exposed on window
export function showToast(msg: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'error' ? 'error' : 'check_circle';
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icon}</span>${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300); }, 3000);
}

export default function ToastContainer() {
  return <div id="toast-container" />;
}
