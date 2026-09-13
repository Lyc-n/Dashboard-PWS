import type { ReactNode } from "react";
import { Tab } from "@/components/atoms/Tab";

export interface FilterTab {
  key: string;
  label: ReactNode;
}

export interface FilterBarProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children?: ReactNode;
}

export function FilterBar({ tabs, activeTab, onTabChange, children }: FilterBarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 max-md:gap-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Tab key={tab.key} active={tab.key === activeTab} onClick={() => onTabChange(tab.key)}>
            {tab.label}
          </Tab>
        ))}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2 max-md:ml-0 max-md:w-full max-md:justify-end">
        {children}
      </div>
    </div>
  );
}

export default FilterBar;