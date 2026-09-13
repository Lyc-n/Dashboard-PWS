import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { Tab } from "@/components/atoms/Tab";

export interface FilterTab {
  key: string;
  label: ReactNode;
}

export interface FilterBarProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  onExport?: () => void;
  children?: ReactNode;
}

export function FilterBar({ tabs, activeTab, onTabChange, onExport, children }: FilterBarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Tab key={tab.key} active={tab.key === activeTab} onClick={() => onTabChange(tab.key)}>
            {tab.label}
          </Tab>
        ))}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {onExport ? (
          <Button variant="export" size="sm" onClick={onExport}>
            Export PDF
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export default FilterBar;