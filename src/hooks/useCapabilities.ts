import { useQuery } from "@tanstack/react-query";
import { getCapabilities } from "@/services/capabilitiesService";

// Returns platform feature flags (database, S3 storage) so components can
// conditionally enable or disable DB/file features without crashing.
// Always check caps?.databaseEnabled before running any DB queries.
export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: () => getCapabilities(),
    // Capabilities don't change during a session, so cache them forever
    // to avoid repeated server round-trips on every page visit.
    staleTime: Number.POSITIVE_INFINITY,
  });
}
