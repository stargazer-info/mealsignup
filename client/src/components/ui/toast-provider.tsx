import { createContext, useContext, useState } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'

interface ToastContextValue {
  showSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider not found')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const showSuccess = (msg: string) => {
    setMessage(msg)
    setOpen(false) // reset
    // 次の tick で開く
    setTimeout(() => setOpen(true), 0)
  }

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      <ToastPrimitive.Provider swipeDirection="up">
        {children}
        <ToastPrimitive.Root
          open={open}
          onOpenChange={setOpen}
          className="bg-primary text-primary-foreground mx-auto rounded-md px-4 py-2 shadow"
        >
          <ToastPrimitive.Title asChild>
            <span>{message}</span>
          </ToastPrimitive.Title>
        </ToastPrimitive.Root>
        <ToastPrimitive.Viewport className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 outline-none z-[100]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
