// src/utils/reportsPdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsPDFData {
  repository: string;
  branch: string;
  dateRange: string;
  generatedDate: string;
  summary: {
    totalCommits: number;
    commitGrowth: string;
    pullRequests: number;
    pullRequestGrowth: string;
    activeContributors: number;
    contributorGrowth: string;
    codeCoverage: number;
    coverageGrowth: string;
  };
  commitActivity: Array<{ week: string; commits: number }>;
  pullRequestBreakdown: {
    merged: number;
    open: number;
    closed: number;
  };
  issueOverview: Array<{ week: string; opened: number; closed: number }>;
  codeModifications: Array<{
    date: string;
    contributor: string;
    filesChanged: number;
    additions: number;
    deletions: number;
  }>;
}

// Helper function to draw a simple bar chart
const drawBarChart = (
  doc: jsPDF,
  data: Array<{ label: string; value: number }>,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width / data.length) * 0.7;
  const barSpacing = (width / data.length) * 0.3;
  
  // Draw title
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y - 5);
  
  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * height;
    const barX = x + index * (barWidth + barSpacing);
    const barY = y + height - barHeight;
    
    doc.setFillColor(255, 111, 97); // Coral color
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Draw value on top of bar
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(item.value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' });
    
    // Draw label
    doc.setFontSize(8);
    doc.text(item.label, barX + barWidth / 2, y + height + 5, { align: 'center' });
  });
};

// Helper function to draw a simple pie chart
const drawPieChart = (
  doc: jsPDF,
  data: Array<{ name: string; value: number }>,
  x: number,
  y: number,
  radius: number,
  title: string
) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return;
  
  let startAngle = 0;
  const colors = [
    [76, 175, 80],  // Green for merged
    [33, 150, 243], // Blue for open
    [244, 67, 54],  // Red for closed
  ];
  
  // Draw title
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y - radius - 5);
  
  // Draw pie slices
  data.forEach((item, index) => {
    const angle = (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    
    // Calculate points for the slice
    const x1 = x + Math.cos(startAngle) * radius;
    const y1 = y + Math.sin(startAngle) * radius;
    const x2 = x + Math.cos(endAngle) * radius;
    const y2 = y + Math.sin(endAngle) * radius;
    
    // Draw slice
    doc.setFillColor(colors[index % colors.length][0], colors[index % colors.length][1], colors[index % colors.length][2]);
    doc.triangle(x, y, x1, y1, x2, y2, 'F');
    
    startAngle = endAngle;
  });
  
  // Draw legend
  let legendY = y - radius;
  data.forEach((item, index) => {
    doc.setFillColor(colors[index % colors.length][0], colors[index % colors.length][1], colors[index % colors.length][2]);
    doc.rect(x + radius + 10, legendY, 5, 5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`${item.name}: ${item.value}`, x + radius + 18, legendY + 4);
    legendY += 6;
  });
};

export const generateReportsPDF = async (data: ReportsPDFData) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text('GitHub Repository Report', 14, yPosition);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Repository: ${data.repository}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Branch: ${data.branch}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Date Range: ${data.dateRange}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Generated: ${data.generatedDate}`, 14, yPosition);
  yPosition += 15;

  // Summary Table
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 10;

  const summaryData = [
    ['Total Commits', data.summary.totalCommits.toString(), data.summary.commitGrowth],
    ['Pull Requests', data.summary.pullRequests.toString(), data.summary.pullRequestGrowth],
    ['Active Contributors', data.summary.activeContributors.toString(), data.summary.contributorGrowth],
    ['Code Coverage', `${data.summary.codeCoverage}%`, data.summary.coverageGrowth],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value', 'Change']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [255, 111, 97] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Commit Activity Bar Chart
  const commitChartData = data.commitActivity.map(item => ({
    label: item.week.replace('Week ', 'W'),
    value: item.commits
  }));
  
  drawBarChart(doc, commitChartData, 14, yPosition, 180, 60, 'Commit Activity (Last 4 Weeks)');
  yPosition += 80;

  // Pull Request Pie Chart
  const prData = [
    { name: 'Merged', value: data.pullRequestBreakdown.merged },
    { name: 'Open', value: data.pullRequestBreakdown.open },
    { name: 'Closed', value: data.pullRequestBreakdown.closed },
  ];
  
  drawPieChart(doc, prData, 60, yPosition, 40, 'Pull Request Status');
  yPosition += 90;

  // Issue Overview Table
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.text('Issue Activity', 14, yPosition);
  yPosition += 10;

  const issueData = data.issueOverview.map(item => [
    item.week,
    item.opened.toString(),
    item.closed.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Week', 'Opened', 'Closed']],
    body: issueData,
    theme: 'striped',
    headStyles: { fillColor: [255, 111, 97] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Code Modifications Table
  if (data.codeModifications.length > 0) {
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Recent Code Modifications', 14, yPosition);
    yPosition += 10;

    const modData = data.codeModifications.slice(0, 15).map(item => [
      item.date,
      item.contributor,
      item.filesChanged.toString(),
      item.additions.toString(),
      item.deletions.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Contributor', 'Files', '+ Additions', '- Deletions']],
      body: modData,
      theme: 'striped',
      headStyles: { fillColor: [255, 111, 97] },
      margin: { left: 14, right: 14 },
    });
  }

  // Save PDF
  const fileName = `github-report-${data.repository.replace('/', '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
};