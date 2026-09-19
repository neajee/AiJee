import { useServersController } from "../../hooks/use-servers-controller";
import { ServersView } from "./view";

export function ServersSection({ isDark, variant = "settings" }: { isDark: boolean; variant?: "settings" | "onboarding" }) {
  const controller = useServersController();
  return <ServersView controller={controller} isDark={isDark} variant={variant} />;
}
