import "./chart.css";

interface LanguagesChartProps {
  languages: Array<{
    name: string;
    percentage: number;
  }>;
}

const LanguagesChart = ({ languages }: LanguagesChartProps) => {
  return (
    <div className="languages-container">
      <div className="chart-card">
        <h3 className="chart-title">Languages Used</h3>
        <div className="chart-placeholder metrics-summary">
          {languages.length === 0 ? (
            <p>Language data unavailable for this repository.</p>
          ) : (
            languages.map((language) => (
              <p key={language.name}>
                <strong>{language.name}:</strong> {language.percentage}%
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguagesChart;
