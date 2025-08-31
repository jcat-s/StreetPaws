import { create } from 'zustand'

interface ModalState {
  isLoginModalOpen: boolean
  isSignUpModalOpen: boolean
  isReportModalOpen: boolean
  isAnimalProfileOpen: boolean
  selectedAnimal: {
    id: string
    name: string
    type: 'dog' | 'cat'
    breed?: string
    age?: string
    gender?: string
    image?: string
    description?: string
  } | null
  openLoginModal: () => void
  closeLoginModal: () => void
  openSignUpModal: () => void
  closeSignUpModal: () => void
  openReportModal: () => void
  closeReportModal: () => void
  openAnimalProfile: (animal: any) => void
  closeAnimalProfile: () => void
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
  // Animal profile modal
  isAnimalProfileOpen: false,
  selectedAnimal: null,
  openAnimalProfile: (animal) => set({ isAnimalProfileOpen: true, selectedAnimal: animal }),
  closeAnimalProfile: () => set({ isAnimalProfileOpen: false, selectedAnimal: null }),
})) 