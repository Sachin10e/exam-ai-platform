import { create } from 'zustand';

interface SidebarState {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isSidebarOpen: true, // Default open on desktop
    setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
