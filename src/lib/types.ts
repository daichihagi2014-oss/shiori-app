export type SectionType = 'schedule' | 'todo' | 'packing' | 'memo'

export interface ScheduleItemMetadata {
  date?: string
  time?: string
  location?: string
  note?: string
  emoji?: string
}

export interface Item {
  id: string
  section_id: string
  content: string
  is_checked: boolean
  position: number
  metadata: ScheduleItemMetadata & Record<string, unknown>
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
  title: string
  destination: string
  description: string
  start_date?: string
  end_date?: string
  password: string
}
