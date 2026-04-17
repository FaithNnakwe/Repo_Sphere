import { CalendarDays, FileCode2 } from "lucide-react";

type CodeModificationRow = {
  date: string;
  contributor: string;
  filesChanged: number;
  additions: number;
  deletions: number;
};

type CodeModificationsProps = {
  rows: CodeModificationRow[];
  loading: boolean;
};

export default function CodeModifications({
  rows,
  loading,
}: CodeModificationsProps) {
  return (
    <section className="reports-section-card">
      <div className="reports-section-card-header">
        <div className="reports-section-card-title-wrap">
          <h2 className="reports-section-title">Code Modifications Log</h2>
          <p>Recent contribution activity for the selected repository.</p>
        </div>

        <div className="reports-section-card-icon">
          <FileCode2 size={18} />
        </div>
      </div>

      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Contributor</th>
              <th>Files Changed</th>
              <th>Additions</th>
              <th>Deletions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="reports-table-empty">
                  Loading modification log...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="reports-table-empty">
                  No modification data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.date}-${row.contributor}`}>
                  <td>
                    <div className="reports-date-cell">
                      <CalendarDays size={14} />
                      <span>{row.date}</span>
                    </div>
                  </td>
                  <td>{row.contributor}</td>
                  <td>{row.filesChanged}</td>
                  <td className="reports-positive">+{row.additions}</td>
                  <td className="reports-negative">-{row.deletions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}