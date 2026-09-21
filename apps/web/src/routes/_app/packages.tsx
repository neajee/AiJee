import { createFileRoute } from "@tanstack/react-router";
import { PackageMarketplace } from '@/features/packages/components/package-marketplace/PackageMarketplace';
function PackagesScreen() {
  return <PackageMarketplace />;
}
export const Route = createFileRoute("/_app/packages")({
  component: PackagesScreen
});
