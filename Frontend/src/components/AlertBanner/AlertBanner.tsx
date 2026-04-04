import "./alert.css";

interface AlertBannerProps {
  message?: string;
  icon?: string;
}

const AlertBanner = ({ 
  message = "⭐ Khua reached 100 commits this week!", 
  icon = "⭐" 
}: AlertBannerProps) => {
  return (
    <div className="alert-banner">
      <span className="alert-icon">{icon}</span>
      <span className="alert-message">{message}</span>
    </div>
  );
};

export default AlertBanner;
