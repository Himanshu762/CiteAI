import React from 'react'
import { SignIn } from "@clerk/clerk-react"
import { motion } from "framer-motion"

export function AuthComponent() {
  return (
    <motion.div 
      className="max-w-md mx-auto bg-background rounded-xl shadow-lg p-6"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtons: "gap-2",
            socialButton: "hover:bg-accent transition-colors",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
            formFieldLabel: "text-muted-foreground",
            formFieldInput: "bg-input border-border rounded-lg",
            footerActionText: "text-muted-foreground",
            footerActionLink: "text-primary hover:text-primary/80"
          }
        }}
      />
    </motion.div>
  )
} 