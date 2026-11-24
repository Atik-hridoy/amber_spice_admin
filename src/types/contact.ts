export interface ContactMessage {
  id: number
  fullName: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'resolved'
  createdAt: string
  created_at?: string
}
