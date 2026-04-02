import "./team.css";

interface TeamMember {
  name: string;
  commits: number;
  pullRequests: number;
  issues: number;
  percentage: number;
}

interface TeamContributionProps {
  members?: TeamMember[];
}

const TeamContribution = ({
  members = []
}: TeamContributionProps) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "?";
  };

  return (
    <div className="team-container">
      <div className="team-card">
        <h3 className="team-title">Team Contribution Breakdown</h3>
        {members.length === 0 ? (
          <div className="team-empty">No contribution data yet.</div>
        ) : (
          <div className="team-list">
            {members.map((member, index) => (
              <div key={index} className="team-member">
                <div className="member-icon">{getInitials(member.name)}</div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-metrics">
                    {member.commits} commits · {member.pullRequests} PRs · {member.issues} issues
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${member.percentage}%` }}
                    ></div>
                  </div>
                  <div className="member-percentage">{member.percentage}% of commits</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamContribution;
