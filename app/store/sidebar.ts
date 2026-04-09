import { create } from 'zustand';

interface SidebarState {
    isOpen: boolean;
    toggle: () => void;
    open: () => void;
    close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isOpen: true, // Default open on desktop
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));
