import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * 🚀 High-Fidelity Professional Tip:
 * Use these typed hooks throughout the application instead of plain 
 * `useDispatch` and `useSelector`. This provides full auto-completion 
 * and prevents type errors during runtime.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
