import "./team.css";

interface TeamMember {
  name: string;
  percentage: number;
  icon?: string;
}

interface TeamContributionProps {
  members?: TeamMember[];
}

const TeamContribution = ({
  members = [
    { name: "Member 1", percentage: 85, icon: "👤" },
    { name: "Member 2", percentage: 60, icon: "👥" },
    { name: "Member 3", percentage: 55, icon: "👤" }
  ]
}: TeamContributionProps) => {
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
                <div className="member-icon">{member.icon || "👤"}</div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
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
