import React, { useEffect, useState } from 'react';
import { CheckCircle, Trash2, Edit2, X } from 'lucide-react';

const typeConfig = {
  success: { bg: 'rgba(46, 125, 50, 0.95)', border: '#4caf50', icon: CheckCircle },
  error: { bg: 'rgba(211, 47, 47, 0.95)', border: '#f44336', icon: Trash2 },
  info: { bg: 'rgba(33, 103, 186, 0.95)', border: '#42a5f5', icon: Edit2 },
};

const Toast = ({ message, type = 'success', onClose }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = typeConfig[type] || typeConfig.success;
  const IconComponent = config.icon;

  useEffect(() => {
    // Trigger entry animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: '12px',
      padding: '14px 20px',
      minWidth: '280px',
      maxWidth: '420px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      fontFamily: 'var(--font-family)',
      fontSize: '14px',
      fontWeight: 500,
      transform: visible && !exiting ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible && !exiting ? 1 : 0,
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <IconComponent size={20} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
