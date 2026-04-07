import "./notification-tray.css";
import type { GitHubNotification } from "../../api";

interface NotificationTrayProps {
  notifications: GitHubNotification[];
  isLoading: boolean;
  errorMessage: string;
  onRemoveNotification: (id: string) => void;
  onClearNotifications: () => void;
}

const formatNotificationTime = (isoTime: string) => {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const NotificationTray = ({
  notifications,
  isLoading,
  errorMessage,
  onRemoveNotification,
  onClearNotifications,
}: NotificationTrayProps) => {
  return (
    <section className="notification-tray" aria-label="Dashboard notifications">
      <div className="notification-tray-header">
        <div>
          <h2>Notifications</h2>
          <p>Important updates will appear here and remain until you dismiss them.</p>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            className="notification-tray-clear-btn"
            onClick={onClearNotifications}
          >
            Clear all
          </button>
        )}
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="notification-tray-state">Loading notifications...</div>
      ) : errorMessage ? (
        <div className="notification-tray-state notification-tray-error">{errorMessage}</div>
      ) : notifications.length === 0 ? (
        <div className="notification-tray-state">No notifications yet.</div>
      ) : (
        <ul className="notification-tray-list">
          {notifications.map((notification) => (
            <li key={notification.id} className="notification-tray-item">
              <div className="notification-tray-item-main">
                <span className="notification-tray-type">{notification.subject.type}</span>
                <p className="notification-tray-title">{notification.subject.title}</p>
                <div className="notification-tray-meta">
                  <span>{notification.repository.full_name}</span>
                  <span>{formatNotificationTime(notification.updated_at)}</span>
                </div>
              </div>
              <button
                type="button"
                className="notification-tray-remove-btn"
                onClick={() => onRemoveNotification(notification.id)}
                aria-label={`Dismiss notification: ${notification.subject.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default NotificationTray;
