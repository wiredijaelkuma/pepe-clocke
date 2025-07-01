<template>
  <div class="payroll-container">
    <h2 class="section-title">Payroll Management</h2>
    
    <div class="payroll-tabs">
      <button @click="activeTab = 'daily'" :class="{ active: activeTab === 'daily' }">Daily Summary</button>
      <button @click="activeTab = 'weekly'" :class="{ active: activeTab === 'weekly' }">Weekly Summary</button>
      <button @click="activeTab = 'employee'" :class="{ active: activeTab === 'employee' }">Employee Summary</button>
      <button @click="activeTab = 'invoice'" :class="{ active: activeTab === 'invoice' }">Invoice Data</button>
      <button @click="activeTab = 'anomalies'" :class="{ active: activeTab === 'anomalies' }">Anomalies</button>
    </div>
    
    <div class="payroll-filters">
      <div class="filter-group">
        <label for="start-date">Start Date:</label>
        <input id="start-date" type="date" v-model="startDate" class="filter-dropdown" />
      </div>
      <div class="filter-group">
        <label for="end-date">End Date:</label>
        <input id="end-date" type="date" v-model="endDate" class="filter-dropdown" />
      </div>
      <button @click="processPayroll" class="process-btn" :disabled="loading">
        {{ loading ? 'Processing...' : 'Process Payroll' }}
      </button>
      <button @click="downloadReport" class="download-btn" v-if="processedData">
        Download Report
      </button>
    </div>
    
    <!-- Daily Summary Tab -->
    <div v-if="activeTab === 'daily' && processedData" class="data-table">
      <h3>Daily Summary</h3>
      <div class="table-scroll">
        <table class="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Total Hours</th>
              <th>Break Hours</th>
              <th>Productive Hours</th>
              <th>Breaks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in processedData.dailySummary" :key="`${row.employee}-${row.date}`">
              <td :class="getEmployeeClass(row.status)">{{ row.employee }}</td>
              <td>{{ row.date }}</td>
              <td>{{ row.clockIn || 'Missing' }}</td>
              <td>{{ row.clockOut || 'Missing' }}</td>
              <td>{{ row.totalHours }}</td>
              <td>{{ row.breakHours }}</td>
              <td>{{ row.productiveHours }}</td>
              <td>{{ row.totalBreaks }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Weekly Summary Tab -->
    <div v-if="activeTab === 'weekly' && processedData" class="data-table">
      <h3>Weekly Summary</h3>
      <div class="table-scroll">
        <table class="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Days Worked</th>
              <th>Total Hours</th>
              <th>Break Hours</th>
              <th>Productive Hours</th>
              <th>Avg Daily Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in processedData.weeklySummary" :key="row.employee">
              <td>{{ row.employee }}</td>
              <td>{{ row.daysWorked }}</td>
              <td>{{ row.totalHours }}</td>
              <td>{{ row.breakHours }}</td>
              <td>{{ row.productiveHours }}</td>
              <td>{{ row.avgDailyHours }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Employee Summary Tab -->
    <div v-if="activeTab === 'employee' && processedData" class="data-table">
      <h3>Employee Summary</h3>
      <div class="table-scroll">
        <table class="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Days Worked</th>
              <th>Total Hours</th>
              <th>Productive Hours</th>
              <th>Lunch Breaks</th>
              <th>Short Breaks</th>
              <th>Bathroom Breaks</th>
              <th>Efficiency %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in processedData.employeeSummary" :key="row.employee">
              <td>{{ row.employee }}</td>
              <td>{{ row.daysWorked }}</td>
              <td>{{ row.totalHours }}</td>
              <td>{{ row.productiveHours }}</td>
              <td>{{ row.lunchBreaks }}</td>
              <td>{{ row.shortBreaks }}</td>
              <td>{{ row.bathroomBreaks }}</td>
              <td>{{ row.efficiency }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Invoice Data Tab -->
    <div v-if="activeTab === 'invoice' && processedData" class="data-table">
      <h3>Invoice Data</h3>
      <div class="table-scroll">
        <table class="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Total Hours</th>
              <th>Productive Hours</th>
              <th>Days Worked</th>
              <th>Weekly Salary</th>
              <th>Total Pay</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in processedData.invoiceData" :key="row.employee">
              <td>{{ row.employee }}</td>
              <td>{{ row.totalHours }}</td>
              <td>{{ row.productiveHours }}</td>
              <td>{{ row.daysWorked }}</td>
              <td>{{ row.weeklySalary }}</td>
              <td>{{ row.totalPay }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Anomalies Tab -->
    <div v-if="activeTab === 'anomalies' && processedData" class="data-table">
      <h3>Anomalies & Corrections</h3>
      <div v-if="pendingAnomalies.length > 0" class="pending-anomalies">
        <h4>⚠️ Pending Confirmations ({{ pendingAnomalies.length }})</h4>
        <div class="anomaly-cards">
          <div v-for="(anomaly, index) in pendingAnomalies" :key="index" class="anomaly-card">
            <div class="anomaly-header">
              <strong>{{ anomaly.employee }}</strong> - {{ anomaly.date }}
            </div>
            <div class="anomaly-details">
              <p><strong>{{ anomaly.type }}</strong></p>
              <p>{{ anomaly.reason }}</p>
              <p><strong>Original:</strong> {{ anomaly.original }}</p>
              <p><strong>Proposed:</strong> {{ anomaly.corrected }}</p>
            </div>
            <div class="anomaly-actions">
              <button @click="approveAnomaly(index)" class="approve-btn">✓ Approve</button>
              <button @click="rejectAnomaly(index)" class="reject-btn">✗ Reject</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="table-scroll">
        <table class="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Type</th>
              <th>Original</th>
              <th>Corrected</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(anomaly, index) in processedData.anomalies" :key="index">
              <td>{{ anomaly.employee }}</td>
              <td>{{ anomaly.date }}</td>
              <td>{{ anomaly.type }}</td>
              <td>{{ anomaly.original }}</td>
              <td>{{ anomaly.corrected }}</td>
              <td>{{ anomaly.reason }}</td>
              <td>
                <span v-if="anomaly.requiresConfirmation && !anomaly.approved && !anomaly.rejected" class="status-pending">Pending</span>
                <span v-else-if="anomaly.approved" class="status-approved">Approved</span>
                <span v-else-if="anomaly.rejected" class="status-rejected">Rejected</span>
                <span v-else class="status-auto">Auto-Applied</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Processing payroll data...</div>
    <div v-if="!processedData && !loading" class="no-data">Select date range and click "Process Payroll" to generate reports.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { databases, Query } from '../../lib/appwrite';

const activeTab = ref('daily');
const startDate = ref(getWeekStart());
const endDate = ref(getWeekEnd());
const loading = ref(false);
const processedData = ref(null);
const userProfiles = ref({});
const pendingAnomalies = ref([]);

// Get current week start (Monday)
function getWeekStart() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  return monday.toISOString().slice(0, 10);
}

// Get current week end (Sunday)
function getWeekEnd() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay() + 7);
  return sunday.toISOString().slice(0, 10);
}

// Helper functions
function parseTime(timeStr) {
  if (!timeStr) return null;
  const date = new Date(`1970-01-01 ${timeStr}`);
  return date;
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const diff = endTime - startTime;
  return diff / (1000 * 60 * 60); // Convert to hours
}

function formatDuration(hours) {
  if (!hours) return '0:00';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  return { 
    startISO: start.toISOString(),
    endISO: end.toISOString()
  };
}

onMounted(async () => {
  await fetchUserProfiles();
});

async function fetchUserProfiles() {
  try {
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68465330002c380c2975'
    );
    
    const profiles = {};
    response.documents.forEach(profile => {
      if (profile.user_Id) {
        profiles[profile.user_Id] = profile.displayName || profile.user_Id;
      }
    });
    
    userProfiles.value = profiles;
  } catch (error) {
    console.error('Failed to fetch user profiles:', error);
  }
}

function getUserDisplayName(userId) {
  return userProfiles.value[userId] || userId;
}

async function processPayroll() {
  loading.value = true;
  
  try {
    const { startISO, endISO } = getDateRange(startDate.value, endDate.value);
    
    // Fetch time logs for the date range
    const response = await databases.listDocuments(
      '684639c3000fbbd515ea',
      '68463a24000779b721a1',
      [
        Query.greaterThanEqual('timestamp', startISO),
        Query.lessThan('timestamp', endISO),
        Query.orderAsc('timestamp'),
        Query.limit(10000)
      ]
    );
    
    const timeLogs = response.documents;
    const processedPayroll = processTimeLogsData(timeLogs);
    processedData.value = processedPayroll;
    
    // Filter anomalies that require confirmation
    pendingAnomalies.value = processedPayroll.anomalies.filter(a => a.requiresConfirmation && !a.approved && !a.rejected);
    
  } catch (error) {
    console.error('Failed to process payroll:', error);
    alert('Failed to process payroll data. Please try again.');
  } finally {
    loading.value = false;
  }
}

function processTimeLogsData(timeLogs) {
  const employees = {};
  const anomalies = [];
  
  // Group by user and date
  const groupedLogs = {};
  
  timeLogs.forEach(log => {
    const userId = log.user_Id;
    const date = new Date(log.timestamp).toISOString().slice(0, 10);
    const key = `${userId}-${date}`;
    
    if (!groupedLogs[key]) {
      groupedLogs[key] = {
        userId,
        date,
        logs: []
      };
    }
    
    groupedLogs[key].logs.push(log);
  });
  
  // Get all unique employees from profiles to check for missing data
  const allEmployees = new Set();
  Object.values(userProfiles.value).forEach(name => {
    if (typeof name === 'string') allEmployees.add(name);
  });
  
  // Get date range for checking missing days
  const dateRange = [];
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Only include weekdays (Monday-Friday)
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      dateRange.push(d.toISOString().slice(0, 10));
    }
  }
  
  // Process each employee's daily data
  Object.values(groupedLogs).forEach(dayData => {
    const { userId, date, logs } = dayData;
    const userName = getUserDisplayName(userId);
    
    if (!employees[userName]) {
      employees[userName] = {
        dailyLogs: {},
        totalHours: 0,
        totalBreakHours: 0,
        totalProductiveHours: 0,
        daysWorked: 0
      };
    }
    
    const dailyRecord = processDailyLogs(logs, userName, date, anomalies);
    employees[userName].dailyLogs[date] = dailyRecord;
    employees[userName].totalHours += dailyRecord.totalHours;
    employees[userName].totalBreakHours += dailyRecord.breakHours;
    employees[userName].totalProductiveHours += dailyRecord.productiveHours;
    employees[userName].daysWorked++;
  });
  
  // Check for missing data (RED) - employees with no data for expected work days
  allEmployees.forEach(employeeName => {
    if (!employees[employeeName]) {
      employees[employeeName] = {
        dailyLogs: {},
        totalHours: 0,
        totalBreakHours: 0,
        totalProductiveHours: 0,
        daysWorked: 0
      };
    }
    
    dateRange.forEach(date => {
      if (!employees[employeeName].dailyLogs[date]) {
        // No data for this day - RED
        anomalies.push({
          employee: employeeName,
          date,
          type: 'No Data',
          original: 'Missing',
          corrected: 'Review required',
          reason: 'No time tracking data for this work day',
          requiresConfirmation: true,
          severity: 'red'
        });
        
        employees[employeeName].dailyLogs[date] = {
          clockIn: null,
          clockOut: null,
          breaks: [],
          totalHours: 0,
          breakHours: 0,
          productiveHours: 0,
          status: 'red'
        };
      }
    });
  });
  
  // Generate summaries
  const dailySummary = generateDailySummary(employees);
  const weeklySummary = generateWeeklySummary(employees);
  const employeeSummary = generateEmployeeSummary(employees);
  const invoiceData = generateInvoiceData(employees);
  
  return {
    dailySummary,
    weeklySummary,
    employeeSummary,
    invoiceData,
    anomalies
  };
}

function processDailyLogs(logs, userName, date, anomalies) {
  const dailyRecord = {
    clockIn: null,
    clockOut: null,
    breaks: [],
    totalHours: 0,
    breakHours: 0,
    productiveHours: 0,
    status: 'normal' // normal, yellow, red
  };
  
  let currentBreak = null;
  
  logs.forEach(log => {
    const status = log.Status;
    const time = new Date(log.timestamp).toLocaleTimeString();
    
    if (status === 'Clocked in') {
      dailyRecord.clockIn = time;
    } else if (status === 'Clocked out') {
      dailyRecord.clockOut = time;
    } else if (status.startsWith('Started')) {
      const breakType = status.replace('Started ', '');
      currentBreak = {
        type: breakType,
        start: time,
        startTimestamp: log.timestamp,
        end: null,
        duration: 0
      };
    } else if (status.startsWith('Back from')) {
      const breakType = status.replace('Back from ', '');
      
      if (currentBreak && currentBreak.type === breakType) {
        currentBreak.end = time;
        currentBreak.endTimestamp = log.timestamp;
        
        // Calculate duration
        const startTime = new Date(currentBreak.startTimestamp);
        const endTime = new Date(currentBreak.endTimestamp);
        let duration = (endTime - startTime) / (1000 * 60 * 60); // hours
        
        // Apply break limits and log anomalies
        const originalDuration = duration;
        if (breakType === 'Lunch' && duration > 0.5) { // 30 minutes
          anomalies.push({
            employee: userName,
            date,
            type: 'Break Overage',
            original: formatDuration(originalDuration),
            corrected: '0:30',
            reason: 'Lunch break exceeded 30 minutes',
            requiresConfirmation: true,
            severity: 'yellow'
          });
          dailyRecord.status = 'yellow';
          duration = 0.5;
        } else if ((breakType === 'Short Break' || breakType === 'Bathroom Break') && duration > 0.25) { // 15 minutes
          anomalies.push({
            employee: userName,
            date,
            type: 'Break Overage',
            original: formatDuration(originalDuration),
            corrected: '0:15',
            reason: `${breakType} exceeded 15 minutes`,
            requiresConfirmation: true,
            severity: 'yellow'
          });
          dailyRecord.status = 'yellow';
          duration = 0.25;
        }
        
        currentBreak.duration = duration;
        dailyRecord.breaks.push(currentBreak);
        dailyRecord.breakHours += duration;
        currentBreak = null;
      }
    }
  });
  
  // Check for late clock-in (after 8:10 AM) - YELLOW
  if (dailyRecord.clockIn) {
    const clockInTime = new Date(`1970-01-01 ${dailyRecord.clockIn}`);
    const lateTime = new Date('1970-01-01 08:10:00');
    
    if (clockInTime > lateTime) {
      const minutesLate = Math.round((clockInTime - lateTime) / (1000 * 60));
      anomalies.push({
        employee: userName,
        date,
        type: 'Late Clock In',
        original: dailyRecord.clockIn,
        corrected: 'No change',
        reason: `Clocked in ${minutesLate} minutes late (after 8:10 AM)`,
        requiresConfirmation: true,
        severity: 'yellow'
      });
      dailyRecord.status = 'yellow';
    }
  }
  
  // Check clock out time
  if (dailyRecord.clockOut) {
    const clockOutTime = new Date(`1970-01-01 ${dailyRecord.clockOut}`);
    const endTime = new Date('1970-01-01 17:00:00'); // 5:00 PM
    
    if (clockOutTime > endTime) {
      // Clock out after 5 PM - YELLOW (OT approval)
      const otMinutes = Math.round((clockOutTime - endTime) / (1000 * 60));
      anomalies.push({
        employee: userName,
        date,
        type: 'Overtime',
        original: dailyRecord.clockOut,
        corrected: 'Approve OT',
        reason: `Clocked out ${otMinutes} minutes after 5:00 PM - Overtime`,
        requiresConfirmation: true,
        severity: 'yellow'
      });
      dailyRecord.status = 'yellow';
    } else if (clockOutTime < endTime) {
      // Clock out before 5 PM - RED (early departure)
      const earlyMinutes = Math.round((endTime - clockOutTime) / (1000 * 60));
      anomalies.push({
        employee: userName,
        date,
        type: 'Early Clock Out',
        original: dailyRecord.clockOut,
        corrected: 'Review required',
        reason: `Clocked out ${earlyMinutes} minutes before 5:00 PM - Early departure`,
        requiresConfirmation: true,
        severity: 'red'
      });
      dailyRecord.status = 'red';
    }
  } else if (dailyRecord.clockIn) {
    // Missing clock out - RED
    anomalies.push({
      employee: userName,
      date,
      type: 'Missing Clock Out',
      original: 'Missing',
      corrected: '5:00:00 PM',
      reason: 'Missing clock out - Added default 5:00 PM',
      requiresConfirmation: true,
      severity: 'red'
    });
    dailyRecord.clockOut = '5:00:00 PM';
    dailyRecord.status = 'red';
  }
  
  // Calculate total hours
  if (dailyRecord.clockIn && dailyRecord.clockOut) {
    const startTime = parseTime(dailyRecord.clockIn);
    const endTime = parseTime(dailyRecord.clockOut);
    dailyRecord.totalHours = calculateDuration(startTime, endTime);
    dailyRecord.productiveHours = dailyRecord.totalHours - dailyRecord.breakHours;
  }
  
  return dailyRecord;
}

function generateDailySummary(employees) {
  const summary = [];
  
  Object.entries(employees).forEach(([userName, data]) => {
    Object.entries(data.dailyLogs).forEach(([date, log]) => {
      summary.push({
        employee: userName,
        date,
        clockIn: log.clockIn,
        clockOut: log.clockOut,
        totalHours: formatDuration(log.totalHours),
        breakHours: formatDuration(log.breakHours),
        productiveHours: formatDuration(log.productiveHours),
        totalBreaks: log.breaks.length,
        status: log.status
      });
    });
  });
  
  return summary.sort((a, b) => a.date.localeCompare(b.date) || a.employee.localeCompare(b.employee));
}

function generateWeeklySummary(employees) {
  const summary = [];
  
  Object.entries(employees).forEach(([userName, data]) => {
    summary.push({
      employee: userName,
      daysWorked: data.daysWorked,
      totalHours: formatDuration(data.totalHours),
      breakHours: formatDuration(data.totalBreakHours),
      productiveHours: formatDuration(data.totalProductiveHours),
      avgDailyHours: formatDuration(data.totalHours / data.daysWorked)
    });
  });
  
  return summary.sort((a, b) => a.employee.localeCompare(b.employee));
}

function generateEmployeeSummary(employees) {
  const summary = [];
  
  Object.entries(employees).forEach(([userName, data]) => {
    const totalBreaks = Object.values(data.dailyLogs).reduce((sum, log) => sum + log.breaks.length, 0);
    const lunchBreaks = Object.values(data.dailyLogs).reduce((sum, log) => 
      sum + log.breaks.filter(b => b.type === 'Lunch').length, 0);
    const shortBreaks = Object.values(data.dailyLogs).reduce((sum, log) => 
      sum + log.breaks.filter(b => b.type === 'Short Break').length, 0);
    const bathroomBreaks = Object.values(data.dailyLogs).reduce((sum, log) => 
      sum + log.breaks.filter(b => b.type === 'Bathroom Break').length, 0);
    
    const efficiency = data.totalHours > 0 ? 
      Math.round((data.totalProductiveHours / data.totalHours) * 100) : 0;
    
    summary.push({
      employee: userName,
      daysWorked: data.daysWorked,
      totalHours: formatDuration(data.totalHours),
      productiveHours: formatDuration(data.totalProductiveHours),
      lunchBreaks,
      shortBreaks,
      bathroomBreaks,
      efficiency
    });
  });
  
  return summary.sort((a, b) => a.employee.localeCompare(b.employee));
}

async function generateInvoiceData(employees) {
  const invoiceData = [];
  const expectedHours = 9; // 8am-5pm = 9 hours
  
  // Get user salaries from profiles
  const salaries = {};
  Object.keys(employees).forEach(userName => {
    const userId = Object.keys(userProfiles.value).find(id => userProfiles.value[id] === userName);
    if (userId) {
      // Find profile with salary info
      const profile = Object.values(userProfiles.value).find(p => p.user_Id === userId);
      salaries[userName] = profile?.weeklySalary || 5000;
    } else {
      salaries[userName] = 5000; // Default
    }
  });
  
  Object.entries(employees).forEach(([userName, data]) => {
    const weeklySalary = salaries[userName] || 5000;
    const payRate = weeklySalary / (expectedHours * 5); // Weekly salary / (9 hours * 5 days)
    const totalPay = (data.totalProductiveHours * payRate).toFixed(2);
    
    invoiceData.push({
      employee: userName,
      totalHours: formatDuration(data.totalHours),
      productiveHours: formatDuration(data.totalProductiveHours),
      daysWorked: data.daysWorked,
      weeklySalary: `${weeklySalary} MXN`,
      totalPay: `${totalPay} MXN`
    });
  });
  
  return invoiceData.sort((a, b) => a.employee.localeCompare(b.employee));
}

function approveAnomaly(index) {
  const anomaly = pendingAnomalies.value[index];
  anomaly.approved = true;
  
  // Find and update in main anomalies list
  const mainIndex = processedData.value.anomalies.findIndex(a => 
    a.employee === anomaly.employee && 
    a.date === anomaly.date && 
    a.type === anomaly.type
  );
  
  if (mainIndex !== -1) {
    processedData.value.anomalies[mainIndex].approved = true;
  }
  
  // Remove from pending
  pendingAnomalies.value.splice(index, 1);
  
  alert(`Approved: ${anomaly.type} correction for ${anomaly.employee}`);
}

function rejectAnomaly(index) {
  const anomaly = pendingAnomalies.value[index];
  anomaly.rejected = true;
  
  // Find and update in main anomalies list
  const mainIndex = processedData.value.anomalies.findIndex(a => 
    a.employee === anomaly.employee && 
    a.date === anomaly.date && 
    a.type === anomaly.type
  );
  
  if (mainIndex !== -1) {
    processedData.value.anomalies[mainIndex].rejected = true;
  }
  
  // Remove from pending
  pendingAnomalies.value.splice(index, 1);
  
  alert(`Rejected: ${anomaly.type} correction for ${anomaly.employee}. Original data will be used.`);
}

function getEmployeeClass(status) {
  switch(status) {
    case 'yellow': return 'employee-yellow';
    case 'red': return 'employee-red';
    default: return '';
  }
}

function downloadReport() {
  if (!processedData.value) return;
  
  // Create CSV content for all tabs
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Daily Summary
  csvContent += "DAILY SUMMARY\n";
  csvContent += "Employee,Date,Clock In,Clock Out,Total Hours,Break Hours,Productive Hours,Total Breaks\n";
  processedData.value.dailySummary.forEach(row => {
    csvContent += `"${row.employee}","${row.date}","${row.clockIn}","${row.clockOut}","${row.totalHours}","${row.breakHours}","${row.productiveHours}","${row.totalBreaks}"\n`;
  });
  
  csvContent += "\n\nWEEKLY SUMMARY\n";
  csvContent += "Employee,Days Worked,Total Hours,Break Hours,Productive Hours,Avg Daily Hours\n";
  processedData.value.weeklySummary.forEach(row => {
    csvContent += `"${row.employee}","${row.daysWorked}","${row.totalHours}","${row.breakHours}","${row.productiveHours}","${row.avgDailyHours}"\n`;
  });
  
  csvContent += "\n\nINVOICE DATA\n";
  csvContent += "Employee,Total Hours,Productive Hours,Days Worked,Weekly Salary,Total Pay\n";
  processedData.value.invoiceData.forEach(row => {
    csvContent += `"${row.employee}","${row.totalHours}","${row.productiveHours}","${row.daysWorked}","${row.weeklySalary}","${row.totalPay}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `payroll_report_${startDate.value}_to_${endDate.value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped>
.payroll-container {
  background: rgba(45, 55, 72, 0.8);
  padding: 24px;
  border-radius: 16px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #ffc107;
}

.payroll-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.payroll-tabs button {
  background: #2d3748;
  color: #a0aec0;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
}

.payroll-tabs button:hover {
  background: rgba(255, 193, 7, 0.7);
  color: #1a202c;
}

.payroll-tabs button.active {
  background: #ffc107;
  color: #1a202c;
}

.payroll-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.filter-dropdown {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 16px;
  color: #333;
  min-width: 180px;
  font-weight: 500;
}

.process-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.process-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.download-btn {
  background: #ffc107;
  color: #1a202c;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.data-table {
  margin-top: 24px;
}

.data-table h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #ffc107;
}

.table-scroll {
  max-height: 500px;
  overflow-y: auto;
  border-radius: 8px;
}

.payroll-table {
  width: 100%;
  border-collapse: collapse;
  background: #2d3748;
}

.payroll-table th,
.payroll-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.payroll-table th {
  background: #1a202c;
  color: #ffc107;
  font-weight: bold;
  position: sticky;
  top: 0;
}

.payroll-table td {
  color: #e2e8f0;
}

.payroll-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.loading, .no-data {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 40px;
  font-size: 1.1rem;
}

.pending-anomalies {
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.pending-anomalies h4 {
  color: #ffc107;
  margin-bottom: 16px;
  font-size: 1.3rem;
}

.anomaly-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.anomaly-card {
  background: #2d3748;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #ffc107;
}

.anomaly-header {
  font-size: 1.1rem;
  margin-bottom: 12px;
  color: #ffc107;
}

.anomaly-details p {
  margin: 4px 0;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.anomaly-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.approve-btn {
  background: #38a169;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.reject-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.status-pending {
  background: #ffc107;
  color: #1a202c;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-approved {
  background: #38a169;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-rejected {
  background: #e53e3e;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-auto {
  background: #4a5568;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.employee-yellow {
  background-color: rgba(255, 193, 7, 0.3) !important;
  color: #1a202c !important;
  font-weight: bold;
}

.employee-red {
  background-color: rgba(229, 62, 62, 0.3) !important;
  color: #fff !important;
  font-weight: bold;
}
</style>