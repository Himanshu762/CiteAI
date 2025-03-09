import React, { createContext, useContext, ReactNode } from 'react'
import { useYjs } from "react-yjs"
import { WebrtcProvider } from "y-webrtc"
import * as Y from "yjs"

interface CollaborationContextType {
  doc: Y.Doc;
  provider: WebrtcProvider;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

interface CollaborationProviderProps {
  documentId: string;
  children: ReactNode;
}

export const CollaborationProvider = ({ 
  documentId, 
  children 
}: CollaborationProviderProps) => {
  const { doc, provider } = useYjs({
    room: documentId,
    connect: (doc: Y.Doc) => new WebrtcProvider(documentId, doc)
  })

  return (
    <CollaborationContext.Provider value={{ doc, provider }}>
      {children}
    </CollaborationContext.Provider>
  )
}