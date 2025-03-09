import { ClerkProvider } from "@clerk/clerk-react"

export const AuthProvider = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          borderRadius: '12px'
        },
        elements: {
          socialButtons: 'grid grid-cols-2 gap-4 w-full',
          socialButton: 'hover:bg-accent transition-colors'
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
} 