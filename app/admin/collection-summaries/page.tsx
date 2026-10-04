import { getDrivers } from "@/app/actions/drivers"
import { CollectionSummariesDrivers } from "@/components/collection-summaries-drivers"

export const dynamic = "force-dynamic"

export default async function CollectionSummariesPage() {
  const drivers = await getDrivers()

  return <CollectionSummariesDrivers drivers={drivers} />
}
