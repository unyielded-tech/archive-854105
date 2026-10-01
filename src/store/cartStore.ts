import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

export interface CartState {
  items: CartItem[]
  couponCode?: string
  addItem: (product: Product, size: string, color: string, quantity: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (code: string) => void
  removeCoupon: () => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,

      addItem: (product, size, color, quantity) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.productId === product.id &&
              item.size === size &&
              item.color === color
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }

          const newItem: CartItem = {
            id: `${product.id}-${size}-${color}-${Date.now()}`,
            productId: product.id,
            product,
            size,
            color,
            quantity,
            price: product.salePrice || product.price,
          }

          return {
            items: [...state.items, newItem],
          }
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: undefined,
        })
      },

      applyCoupon: (code) => {
        set({
          couponCode: code,
        })
      },

      removeCoupon: () => {
        set({
          couponCode: undefined,
        })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getTotal: () => {
        return get().getSubtotal()
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'archive-cart',
    }
  )
)
