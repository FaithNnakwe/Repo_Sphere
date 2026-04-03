import "./card.css";

interface StatCardProps {
  icon?: string;
  label: string;
  value: string | number;
  showGraph?: boolean;
}

const StatCard = ({ 
  icon = "📊", 
  label, 
  value, 
  showGraph = true 
}: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="card-top">
        <div className="card-icon">{icon}</div>
        {showGraph && <div className="card-graph">Graph</div>}
      </div>

      <div className="card-bottom">
        <div className="card-label">{label}</div>
        <div className="card-value">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;
