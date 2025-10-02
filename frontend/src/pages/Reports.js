import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, FileText, TrendingUp, Activity, Target } from 'lucide-react';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const { reports, notifications } = useApp();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Mock data for charts
  const weightProgressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Weight (kg)',
        data: [75, 74.5, 73.8, 73.2, 72.5, 72],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Target Weight',
        data: [70, 70, 70, 70, 70, 70],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        tension: 0,
      },
    ],
  };

  const calorieIntakeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories Consumed',
        data: [1800, 2000, 1900, 2100, 1850, 2200, 1950],
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
      },
      {
        label: 'Target Calories',
        data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  const macroDistributionData = {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [
      {
        data: [30, 45, 25],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const mockReports = [
    {
      id: 1,
      title: 'Monthly Progress Report - September 2025',
      date: new Date('2025-09-30'),
      type: 'progress',
      summary: 'Excellent progress! Lost 3kg this month.',
      status: 'new',
    },
    {
      id: 2,
      title: 'Blood Test Results',
      date: new Date('2025-09-15'),
      type: 'medical',
      summary: 'All parameters within normal range.',
      status: 'read',
    },
    {
      id: 3,
      title: 'Diet Compliance Report',
      date: new Date('2025-09-01'),
      type: 'diet',
      summary: '85% adherence to diet plan.',
      status: 'read',
    },
  ];

  const handleDownloadReport = (report) => {
    toast.success(`Downloading ${report.title}...`);
    // In production, this would trigger actual file download
  };

  const handlePrintReport = (report) => {
    toast.info('Opening print dialog...');
    window.print();
  };

  const viewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Medical Feedback & Reports</h1>
        <p className="text-gray-600 mt-2">
          Track your progress and view medical reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight Lost</p>
              <p className="text-2xl font-bold text-gray-900">3.0 kg</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Goal Progress</p>
              <p className="text-2xl font-bold text-gray-900">60%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Activity className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Calories</p>
              <p className="text-2xl font-bold text-gray-900">1,950</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reports</p>
              <p className="text-2xl font-bold text-gray-900">{mockReports.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Weight Progress">
          <div className="h-64">
            <Line data={weightProgressData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Daily Calorie Intake">
          <div className="h-64">
            <Bar data={calorieIntakeData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Macronutrient Distribution">
          <div className="h-64 flex items-center justify-center">
            <div className="w-64">
              <Doughnut data={macroDistributionData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card title="Weekly Summary">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Diet Adherence</span>
              <span className="text-lg font-bold text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Workout Days</span>
              <span className="text-lg font-bold text-blue-600">5/7</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium">Water Intake</span>
              <span className="text-lg font-bold text-yellow-600">2.5L</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Sleep Average</span>
              <span className="text-lg font-bold text-purple-600">7.5h</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports List */}
      <Card title="Medical Reports & Feedback">
        <div className="space-y-4">
          {mockReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FileText className="text-primary-600" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    {report.status === 'new' && (
                      <Badge variant="success" size="sm">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.summary}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.date.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewReport(report)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={() => handleDownloadReport(report)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Detail Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={selectedReport?.title}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <Badge variant="primary">{selectedReport.type}</Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Generated on {selectedReport.date.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={() => handleDownloadReport(selectedReport)}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintReport(selectedReport)}
                >
                  Print
                </Button>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3>Summary</h3>
              <p>{selectedReport.summary}</p>

              <h3>Detailed Analysis</h3>
              <p>
                Your progress over the past month has been excellent. You've successfully
                maintained a calorie deficit while meeting your macronutrient targets.
              </p>

              <h3>Key Metrics</h3>
              <ul>
                <li>Starting Weight: 75 kg</li>
                <li>Current Weight: 72 kg</li>
                <li>Weight Loss: 3 kg</li>
                <li>Average Daily Calories: 1,950 kcal</li>
                <li>Diet Adherence: 85%</li>
              </ul>

              <h3>Recommendations</h3>
              <ul>
                <li>Continue with current diet plan</li>
                <li>Increase protein intake slightly (target 35%)</li>
                <li>Add 2 more workout sessions per week</li>
                <li>Maintain hydration levels</li>
              </ul>

              <h3>Doctor's Notes</h3>
              <p>
                Patient is responding well to the diet plan. All health markers are within
                normal range. Continue monitoring progress weekly.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
