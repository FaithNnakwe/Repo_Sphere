import { useEffect } from "react";
import "./achievement-celebration.css";

interface AchievementCelebrationProps {
  milestone: number;
  onComplete: () => void;
}

const confettiPalette = [
  "#ff6f61",
  "#ffb347",
  "#ffd166",
  "#4ecdc4",
  "#2a9d8f",
  "#70a1ff",
  "#f77fbe",
  "#9b5de5",
];

const AchievementCelebration = ({ milestone, onComplete }: AchievementCelebrationProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2600);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="achievement-celebration" aria-live="polite" role="status">
      <div className="achievement-celebration-card">
        <p className="achievement-celebration-kicker">Milestone Unlocked</p>
        <h2>{milestone} Contributions</h2>
        <p className="achievement-celebration-copy">Your consistency is paying off. Keep building momentum.</p>
      </div>

      <div className="achievement-confetti" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, index) => {
          const color = confettiPalette[index % confettiPalette.length];
          return (
            <span
              key={`${milestone}-${index}`}
              className="achievement-confetti-piece"
              style={{
                left: `${(index * 17) % 100}%`,
                animationDelay: `${(index % 7) * 70}ms`,
                animationDuration: `${1500 + (index % 5) * 180}ms`,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AchievementCelebration;
