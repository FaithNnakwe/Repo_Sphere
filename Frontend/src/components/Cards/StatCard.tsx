import "./card.css";
import type { ElementType } from "react";

type StatCardVariant = "commits" | "pullRequests" | "issues" | "linesOfCode";

interface StatCardProps {
  icon?: ElementType;
  label: string;
  value: string | number;
  change?: string;
  variant?: StatCardVariant;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  variant = "commits",
}: StatCardProps) => {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="card-top">
        <div className="card-top-left">
          {Icon && (
            <div className="card-icon">
              <Icon size={20} strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="card-squiggle" aria-hidden="true">
          <svg
            width="52"
            height="28"
            viewBox="0 0 52 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="squiggle-path"
              d="M2 22C6 22 6 8 10 8C14 8 14 24 18 24C22 24 22 10 26 10C30 10 30 18 34 18C38 18 38 4 42 4C46 4 46 14 50 14"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="card-bottom">
        <div className="card-label">{label}</div>

        <div className="card-value-row">
          <span className="card-value">{value}</span>
          {change && <span className="card-change">{change}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;