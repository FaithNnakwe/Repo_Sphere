import "./dashboard.css";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import AlertBanner from "../AlertBanner/AlertBanner";
import StatsGrid from "../Cards/StatsGrid";
import MetricsChart from "../Charts/MetricsChart";
import TeamContribution from "../TeamContribution/TeamContribution";
import LanguagesChart from "../Charts/LanguagesChart";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-main">
        <Header />
        
        <div className="dashboard-content">
          <div className="content-header">
            <h1>Repository Dashboard</h1>
            <p>Track contributions and insights across your repository</p>
          </div>

          <AlertBanner />
          
          <StatsGrid />
          
          <MetricsChart />
          
          <TeamContribution />
          
          <LanguagesChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
