import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Topbar } from "@/components/organisms/Topbar";
import { Sidebar } from "@/components/organisms/Sidebar";
import { BottomNav } from "@/components/organisms/BottomNav";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <Topbar onToggleCollapse={toggle} />
        <div className="w-full max-w-275 px-7 pb-8 pt-7 max-md:px-3.5 max-md:pb-21.5 max-md:pt-4">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default AppShell;