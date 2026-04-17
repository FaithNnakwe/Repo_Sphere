import StatCard from "./StatCard";
import "./stats-grid.css";
import type { ElementType } from "react";

interface StatsGridProps {
  stats?: Array<{
    icon?: ElementType;
    label: string;
    value: string | number;
  }>;
}

const StatsGrid = ({
  stats = [],
}: StatsGridProps) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
};

export default StatsGrid;