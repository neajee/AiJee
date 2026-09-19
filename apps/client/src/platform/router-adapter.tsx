import { useEffect, type ReactNode } from "react";
import {
  Link as TanStackLink,
  Outlet,
  useLocation,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

type NavigationTarget = string | { pathname: string; params?: Record<string, string> };

function toPath(target: NavigationTarget): string {
  if (typeof target === "string") return target;
  let path = target.pathname;
  for (const [key, value] of Object.entries(target.params ?? {})) path = path.replace(`[${key}]`, encodeURIComponent(value));
  return path;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    navigate: (target: NavigationTarget) => navigate({ to: toPath(target) }),
    push: (target: NavigationTarget) => navigate({ to: toPath(target) }),
    replace: (target: NavigationTarget) => navigate({ to: toPath(target), replace: true }),
    back: () => window.history.back(),
  };
}

export function usePathname(): string {
  return useLocation({ select: (location) => location.pathname });
}

export function useLocalSearchParams<T extends Record<string, string>>(): Partial<T> {
  return (useRouterState as any)({ select: (state: any) => Object.assign({}, ...state.matches.map((match: any) => match.params)) }) as Partial<T>;
}

export function Redirect({ href }: { href: NavigationTarget }): null {
  const router = useRouter();
  useEffect(() => { router.replace(href); }, [href]);
  return null;
}

export function Link({ href, children, ...props }: { href: NavigationTarget; children: ReactNode; [key: string]: unknown }) {
  return <TanStackLink to={toPath(href)} {...props}>{children}</TanStackLink>;
}

export function Slot() { return <Outlet />; }
export function Stack({ children }: { children?: ReactNode; screenOptions?: unknown }) { return <>{children}</>; }
