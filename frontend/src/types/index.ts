export interface Paper {
  id: string
  title: string
  content: string
  citations: Citation[]
  // ... other fields
}

export interface Citation {
  id: string
  source: string
  page?: number
  // ... other fields
} 