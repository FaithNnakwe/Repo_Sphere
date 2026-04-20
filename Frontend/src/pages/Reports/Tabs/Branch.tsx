import { GitBranch, CalendarDays } from "lucide-react";

type RepoBranch = {
  name: string;
};

type DateFilterOption = {
  label: string;
  value: string;
};

type BranchTabProps = {
  branches: RepoBranch[];
  selectedBranch: string;
  onChangeBranch: (value: string) => void;
  loading: boolean;
  dateFilter: string;
  onChangeDateFilter: (value: string) => void;
  dateFilters: DateFilterOption[];
};

export default function BranchTab({
  branches,
  selectedBranch,
  onChangeBranch,
  loading,
  dateFilter,
  onChangeDateFilter,
  dateFilters,
}: BranchTabProps) {
  return (
    <section className="reports-section-card">
      <div className="reports-section-card-header">
        <div className="reports-section-card-title-wrap">
          <h2 className="reports-section-title">Filters</h2>
          <p>Choose a branch and timeframe to update the analytics view.</p>
        </div>

        <div className="reports-section-card-icon">
          <GitBranch size={18} />
        </div>
      </div>

      <div className="reports-filters-grid">
        <div className="reports-filter-block">
          <label className="reports-label">Branch</label>
          <div className="reports-filter-input-wrap">
            <GitBranch size={16} />
            <select
              className="reports-select"
              value={selectedBranch}
              onChange={(e) => onChangeBranch(e.target.value)}
              disabled={loading}
            >
              {branches.length === 0 ? (
                <option value="">No branches found</option>
              ) : (
                branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="reports-filter-block">
          <label className="reports-label">Date Range</label>
          <div className="reports-filter-input-wrap">
            <CalendarDays size={16} />
            <select
              className="reports-select"
              value={dateFilter}
              onChange={(e) => onChangeDateFilter(e.target.value)}
            >
              {dateFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}