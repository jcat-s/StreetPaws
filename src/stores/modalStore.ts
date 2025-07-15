import { create } from 'zustand'

interface ModalState {
  isLoginModalOpen: boolean
  isSignUpModalOpen: boolean
  isReportModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  openSignUpModal: () => void
  closeSignUpModal: () => void
  openReportModal: () => void
  closeReportModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isLoginModalOpen: false,
  isSignUpModalOpen: false,
  isReportModalOpen: false,
  
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  
  openSignUpModal: () => set({ isSignUpModalOpen: true }),
  closeSignUpModal: () => set({ isSignUpModalOpen: false }),
  
  openReportModal: () => set({ isReportModalOpen: true }),
  closeReportModal: () => set({ isReportModalOpen: false }),
})) 