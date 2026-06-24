export type SectionType = 'schedule' | 'todo' | 'packing' | 'memo' | 'expense'

export interface ScheduleItemMetadata {
  date?: string
  time?: string
  location?: string
  note?: string
  emoji?: string
  photo_url?: string
  amount?: number
  category?: string
  paid_by?: string
}

export interface ExpenseItemMetadata {
  amount?: number
  paid_by?: string
  category?: string
}

export interface ExpenseMember {
  name: string
  ratio: number
}

export interface Item {
  id: string
  section_id: string
  content: string
  is_checked: boolean
  position: number
  metadata: ScheduleItemMetadata & ExpenseItemMetadata & Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  itinerary_id: string
  type: SectionType
  title: string
  position: number
  items: Item[]
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Itinerary {
  id: string
  slug: string
  title: string
  destination: string
  description: string
  start_date: string | null
  end_date: string | null
  cover_image_url: string
  password_hash: string
  sections: Section[]
  created_at: string
  updated_at: string
}

export interface CreateItineraryInput {
  slug?: string
  title: string
  destination: string
  description: string
  start_date?: string
  end_date?: string
  password: string
}
