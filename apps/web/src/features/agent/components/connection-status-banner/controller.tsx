import { useConnectionStatusController } from '../../hooks/use-connection-status-controller';
import { ConnectionStatusBannerView } from './ConnectionStatusBanner';
export function ConnectionStatusBanner() {
  const controller = useConnectionStatusController();
  const {
    mounted,
    ...viewProps
  } = controller;
  if (!mounted) return null;
  return <ConnectionStatusBannerView {...viewProps} />;
}
