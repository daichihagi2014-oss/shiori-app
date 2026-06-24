import ItineraryPageClient from './ItineraryPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ItineraryPage({ params }: Props) {
  const { slug } = await params
  return <ItineraryPageClient slug={slug} />
}
