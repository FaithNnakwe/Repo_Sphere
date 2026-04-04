import StatCard from "./StatCard";
import "./stats-grid.css";

interface StatsGridProps {
  stats?: Array<{
    icon: string;
    label: string;
    value: string | number;
  }>;
}

const StatsGrid = ({ 
  stats = [
    { icon: "📊", label: "Total Number of Commits", value: "1,245" },
    { icon: "🔀", label: "Total Pull Requests", value: "48" },
    { icon: "⚠️", label: "Issues Opened", value: "12" },
    { icon: "📝", label: "# Lines of Code", value: "45,320" }
  ]
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
