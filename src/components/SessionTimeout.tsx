import React, { useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Storage } from '../utils/storage-util';
import { useAppDispatch } from '../hooks';
import { logoutUser, resetUserState } from '../reducers/user.reducer';

const SessionTimeout: React.FC = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<any>(null);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

  const dispatch = useAppDispatch();

  const isLoggingOut = useRef(false);

  const logout = useCallback((reason: 'inactivity' | 'api' = 'inactivity') => {
    if (reason === 'inactivity') {
      const hasToken = Storage.local.get('TimeSheet-authenticationToken') || Storage.session.get('TimeSheet-authenticationToken');
      if (!hasToken) return; // Don't trigger inactivity logout if already logged out
    }

    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    dispatch(resetUserState()); // Synchronously clear user state immediately
    dispatch(logoutUser());
    Storage.session.remove('TimeSheet-authenticationToken');
    Storage.local.remove('TimeSheet-authenticationToken');
    Storage.session.remove('TimeSheet-refreshToken');
    Storage.local.remove('TimeSheet-refreshToken');
    Storage.session.remove('user');
    
    if (reason === 'inactivity') {
      message.error("Session expired. Please login again!");
    } else {
      message.error("Session expired. Please login again!");
    }
    
    setTimeout(() => {
       navigate('/landing');
       isLoggingOut.current = false;
    }, 2000);
  }, [navigate, dispatch]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    // Listen for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity));
    
    // Listen for manual session-expired event from interceptor
    const handleSessionExpired = () => logout('api');
    window.addEventListener('session-expired', handleSessionExpired);

    // Initial timer start
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      window.removeEventListener('session-expired', handleSessionExpired);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer, logout]);

  return null; // This component doesn't render anything
};

export default SessionTimeout;
