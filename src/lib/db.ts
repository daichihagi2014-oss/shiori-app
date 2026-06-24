import { supabase } from './supabase'
import { CreateItineraryInput, Itinerary, Item, Section, SectionType } from './types'
import { generateSlug, hashPassword } from './utils'

export async function createItinerary(input: CreateItineraryInput): Promise<{ slug: string } | { error: string }> {
  const passwordHash = await hashPassword(input.password)

  // Use custom slug if provided, otherwise generate random
  const candidateSlug = input.slug?.trim() || generateSlug()

  const { data: existing } = await supabase
    .from('itineraries')
    .select('slug')
    .eq('slug', candidateSlug)
    .single()

  if (existing) {
    if (input.slug) return { error: `「${candidateSlug}」はすでに使われています。別のIDを入力してください。` }
  }

  const finalSlug = existing ? generateSlug() : candidateSlug

  const { error } = await supabase.from('itineraries').insert({
    slug: finalSlug,
    title: input.title,
    destination: input.destination || '',
    description: input.description || '',
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    cover_image_url: '',
    password_hash: passwordHash,
  })

  if (error) return { error: error.message }
  return { slug: finalSlug }
}

export async function getItinerary(slug: string): Promise<Itinerary | null> {
  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !itinerary) return null

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('itinerary_id', itinerary.id)
    .order('position')

  const sectionsWithItems: Section[] = []
  for (const section of sections ?? []) {
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('section_id', section.id)
      .order('position')

    sectionsWithItems.push({ ...section, items: items ?? [], data: section.data ?? {} })
  }

  return { ...itinerary, sections: sectionsWithItems }
}

export async function verifyPassword(slug: string, password: string): Promise<boolean> {
  const hash = await hashPassword(password)
  const { data } = await supabase
    .from('itineraries')
    .select('password_hash')
    .eq('slug', slug)
    .single()

  return data?.password_hash === hash
}

export async function updateItinerary(
  itineraryId: string,
  updates: Partial<Pick<Itinerary, 'title' | 'destination' | 'description' | 'start_date' | 'end_date' | 'cover_image_url'>>
): Promise<void> {
  await supabase
    .from('itineraries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itineraryId)
}

export async function addSection(
  itineraryId: string,
  type: SectionType,
  title: string,
  position: number
): Promise<Section | null> {
  const { data, error } = await supabase
    .from('sections')
    .insert({ itinerary_id: itineraryId, type, title, position })
    .select()
    .single()

  if (error) return null
  return { ...data, items: [], data: data.data ?? {} }
}

export async function updateSection(sectionId: string, updates: Partial<Pick<Section, 'title' | 'position' | 'data'>>): Promise<void> {
  await supabase.from('sections').update(updates).eq('id', sectionId)
}

export async function deleteSection(sectionId: string): Promise<void> {
  await supabase.from('sections').delete().eq('id', sectionId)
}

export async function addItem(
  sectionId: string,
  content: string,
  position: number,
  metadata: Record<string, unknown> = {}
): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .insert({ section_id: sectionId, content, position, is_checked: false, metadata })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateItem(
  itemId: string,
  updates: Partial<Pick<Item, 'content' | 'is_checked' | 'position' | 'metadata'>>
): Promise<void> {
  await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
}

export async function deleteItem(itemId: string): Promise<void> {
  await supabase.from('items').delete().eq('id', itemId)
}

export async function uploadCoverImage(
  itineraryId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `covers/${itineraryId}.${ext}`

  const { error } = await supabase.storage
    .from('shiori-images')
    .upload(path, file, { upsert: true })

  if (error) return null

  const { data } = supabase.storage.from('shiori-images').getPublicUrl(path)
  return data.publicUrl
}
