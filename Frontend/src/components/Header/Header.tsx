import { useEffect, useMemo, useRef, useState } from "react";
import "./header.css";
import type { GitHubNotification } from "../../api";

interface HeaderProps {
  repositories: string[];
  selectedRepository: string;
  onRepositoryChange: (repository: string) => void;
  isLoading: boolean;
  notifications: GitHubNotification[];
  notificationsLoading: boolean;
  notificationsError: string;
  onRemoveNotification: (id: string) => void;
  onClearNotifications: () => void;
}

const formatNotificationTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const Header = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  isLoading,
  notifications,
  notificationsLoading,
  notificationsError,
  onRemoveNotification,
  onClearNotifications,
}: HeaderProps) => {
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!bellMenuRef.current) {
        return;
      }

      if (!bellMenuRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="header">
      <div className="header-left">
        <div className="repo-dropdown">
          <select
            className="dropdown-select"
            value={selectedRepository}
            onChange={(event) => onRepositoryChange(event.target.value)}
            disabled={isLoading || repositories.length === 0}
          >
            {repositories.length === 0 ? (
              <option value="">No repositories</option>
            ) : (
              repositories.map((repository) => (
                <option key={repository} value={repository}>
                  {repository}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="date-display">
          <span>{today}</span>
        </div>
      </div>

      <div className="header-right">
        <input
          type="text"
          className="search-bar"
          placeholder="Search Bar"
        />

        <div className="notification-bell" ref={bellMenuRef}>
          <button
            type="button"
            className="notification-bell-button"
            onClick={() => setIsBellOpen((open) => !open)}
            aria-label="Open notifications"
            aria-expanded={isBellOpen}
          >
            <span className="notification-bell-icon">🔔</span>
            {unreadCount > 0 && <span className="notification-bell-count">{unreadCount}</span>}
          </button>

          {isBellOpen && (
            <div className="notification-menu">
              <div className="notification-menu-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-menu-clear"
                    onClick={onClearNotifications}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {notificationsLoading && unreadCount === 0 ? (
                <p className="notification-menu-state">Loading notifications...</p>
              ) : notificationsError ? (
                <p className="notification-menu-state notification-menu-error">{notificationsError}</p>
              ) : unreadCount === 0 ? (
                <p className="notification-menu-state">No notifications right now.</p>
              ) : (
                <ul className="notification-menu-list">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="notification-menu-item">
                      <div className="notification-item-top">
                        <span className="notification-type">{notification.subject.type}</span>
                        <button
                          type="button"
                          className="notification-remove"
                          onClick={() => onRemoveNotification(notification.id)}
                          aria-label={`Remove notification: ${notification.subject.title}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="notification-title">{notification.subject.title}</p>
                      <div className="notification-meta">
                        <span>{notification.repository.full_name}</span>
                        <span>{formatNotificationTime(notification.updated_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="user-info">
          <div className="user-icon">👤</div>
          <span>Shared View</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
