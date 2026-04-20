import "./alert.css";
import type { ElementType } from "react";

interface AlertBannerProps {
  message?: string;
  icon?: ElementType;
}

const AlertBanner = ({
  message = "Khua reached 100 commits this week!",
  icon: Icon,
}: AlertBannerProps) => {
  return (
    <div className="alert-banner">
      {Icon && (
        <span className="alert-icon">
          <Icon size={20} strokeWidth={2} />
        </span>
      )}
      <span className="alert-message">{message}</span>
    </div>
  );
};

export default AlertBanner;
