import { create } from 'zustand'

interface StateStoreState {
  currentPage: string
  setPage: (page: string) => void
}

const usePageStore = create<StateStoreState>((set) => ({
  currentPage: localStorage.getItem('currentPage') || '/dashboard',
  setPage: (page: string): void => {
    set({ currentPage: page })
    localStorage.setItem('currentPage', page)
  }
}))

export default usePageStore
