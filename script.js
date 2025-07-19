class SalaryTracker {
    constructor() {
        this.currentJobId = null;
        this.currentPeriod = 'all';
        this.currentChartView = 'overall';
        this.jobs = [];
        this.entries = [];
        this.analyticsSettings = {
            period: 'all',
            customStartDate: null,
            customEndDate: null,
            includedJobs: [], // Will store job IDs to include in analytics
            dataType: 'overall'
        };

        this.chart = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupDefaultJobs();
        this.setupEventListeners();
        this.populateJobSelects();
        this.populateChartViewDropdown();
        this.setupChart();
        this.updateSalaryHistory();

        // Initialize analytics settings to include all jobs by default
        if (this.jobs.length > 0 && this.analyticsSettings.includedJobs.length === 0) {
            this.analyticsSettings.includedJobs = this.jobs.map(job => job.id);
        }

        this.updateGeneralAnalytics();
        this.updateBaseRatesInfo();

        // Set current job to first job if available
        if (this.jobs.length > 0) {
            this.currentJobId = this.jobs[0].id;
            this.updateStatistics();
        }
    }

    setupDefaultJobs() {
        // If no jobs exist, create default ones
        if (this.jobs.length === 0) {
            const mainJobId = this.generateId();

            this.jobs = [
                {
                    id: mainJobId,
                    name: 'Main Job',
                    baseRate: 10395,
                    baseHours: 192
                },
                {
                    id: this.generateId(),
                    name: 'Second Job',
                    baseRate: 10395,
                    baseHours: 192
                },
                {
                    id: this.generateId(),
                    name: 'Side Jobs',
                    baseRate: 10395,
                    baseHours: 192
                }
            ];

            // Add known salary data for Main Job
            const salaryData = [
                { month: '2024-10', salary: 5108.11, hours: 96 },
                { month: '2024-11', salary: 6246.24, hours: 96 },
                { month: '2024-12', salary: 6578.10, hours: 96 },
                { month: '2025-01', salary: 6290.21, hours: 96 },
                { month: '2025-02', salary: 6024.42, hours: 96 },
                { month: '2025-03', salary: 5791.10, hours: 96 },
                { month: '2025-04', salary: 5447.98, hours: 96 },
                { month: '2025-05', salary: 6562.94, hours: 96 },
                { month: '2025-06', salary: 6895.78, hours: 96 }
            ];

            // Add entries for Main Job
            salaryData.forEach(data => {
                this.entries.push({
                    id: this.generateId(),
                    jobId: mainJobId,
                    month: data.month,
                    salary: data.salary,
                    hours: data.hours
                });
            });

            this.saveData();
        }
    }

    setupEventListeners() {
        // Period selection
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updateGeneralAnalytics();
            this.updateChart();
            this.updateSalaryHistory();
        });

        // Analytics Settings Modal
        const analyticsSettingsBtn = document.getElementById('analyticsSettingsBtn');
        const analyticsSettingsModal = document.getElementById('analyticsSettingsModal');

        analyticsSettingsBtn.addEventListener('click', () => {
            this.populateAnalyticsSettingsModal();
            analyticsSettingsModal.style.display = 'block';
        });

        // Close analytics settings modal
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                analyticsSettingsModal.style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === analyticsSettingsModal) {
                analyticsSettingsModal.style.display = 'none';
            }
        });

        // Custom date range toggle
        document.getElementById('analyticsPeriodSelect').addEventListener('change', (e) => {
            const customDateRange = document.getElementById('customDateRange');
            customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Apply analytics settings
        document.getElementById('applyAnalyticsSettings').addEventListener('click', () => {
            this.applyAnalyticsSettings();
            analyticsSettingsModal.style.display = 'none';
        });

        // Reset analytics settings
        document.getElementById('resetAnalyticsSettings').addEventListener('click', () => {
            this.resetAnalyticsSettings();
        });

        // Select/Deselect all jobs
        document.getElementById('selectAllJobs').addEventListener('click', () => {
            this.selectAllJobs(true);
        });

        document.getElementById('deselectAllJobs').addEventListener('click', () => {
            this.selectAllJobs(false);
        });

        // Job selection for viewing data
        document.getElementById('viewJobSelect').addEventListener('change', (e) => {
            this.currentJobId = e.target.value;
            this.updateStatistics();
        });

        // Form submission for adding salary entry
        document.getElementById('salaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSalaryEntry();
        });

        // Chart type change
        document.querySelectorAll('input[name="chartType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateChart();
            });
        });

        // Chart view dropdown button
        const chartViewBtn = document.getElementById('chartViewBtn');
        const chartViewDropdown = document.getElementById('chartViewDropdown');

        chartViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chartViewDropdown.style.display = chartViewDropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.matches('.dropdown-btn') && !e.target.closest('.dropdown-content')) {
                chartViewDropdown.style.display = 'none';
            }
        });

        // Chart view selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('#chartViewDropdown')) {
                const link = e.target.closest('a');
                if (link) {
                    e.preventDefault();

                    // Remove active class from all links
                    document.querySelectorAll('#chartViewDropdown a').forEach(a => {
                        a.classList.remove('active');
                    });

                    // Add active class to clicked link
                    link.classList.add('active');

                    // Update chart view
                    const view = link.getAttribute('data-view');
                    const jobId = link.getAttribute('data-job-id');

                    if (view === 'overall') {
                        this.currentChartView = 'overall';
                        chartViewBtn.textContent = 'Overall ▼';
                    } else {
                        this.currentChartView = jobId;
                        chartViewBtn.textContent = link.textContent + ' ▼';
                    }

                    // Update chart
                    this.updateChart();

                    // Hide dropdown
                    chartViewDropdown.style.display = 'none';
                }
            }
        });

        // Clear all data button
        document.getElementById('clearAllData').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all salary data? This action cannot be undone.')) {
                this.entries = [];
                this.saveData();
                this.updateSalaryHistory();
                this.updateGeneralAnalytics();
                this.updateChart();
                this.updateStatistics();
            }
        });

        // Job settings modal
        const jobSettingsBtn = document.getElementById('jobSettingsBtn');
        const jobSettingsModal = document.getElementById('jobSettingsModal');
        const editJobModal = document.getElementById('editJobModal');
        const closeButtons = document.querySelectorAll('.close-modal');

        jobSettingsBtn.addEventListener('click', () => {
            this.populateJobsList();
            jobSettingsModal.style.display = 'block';
        });

        // Close job settings modal
        jobSettingsModal.querySelector('.close-modal').addEventListener('click', () => {
            jobSettingsModal.style.display = 'none';
        });

        // Close edit job modal
        editJobModal.querySelector('.close-modal').addEventListener('click', () => {
            editJobModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === jobSettingsModal) {
                jobSettingsModal.style.display = 'none';
            }
            if (e.target === editJobModal) {
                editJobModal.style.display = 'none';
            }
        });

        // Add new job form
        document.getElementById('addJobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewJob();
        });

        // Edit job form
        document.getElementById('editJobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveJobEdit();
        });

        // Edit entry modal
        const editEntryModal = document.getElementById('editEntryModal');

        // Close edit entry modal
        editEntryModal.querySelector('.close-modal').addEventListener('click', () => {
            editEntryModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === editEntryModal) {
                editEntryModal.style.display = 'none';
            }
        });

        // Edit entry form
        document.getElementById('editEntryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntryEdit();
        });
    }

    populateJobSelects() {
        const jobSelect = document.getElementById('jobSelect');
        const viewJobSelect = document.getElementById('viewJobSelect');

        // Clear existing options
        jobSelect.innerHTML = '';
        viewJobSelect.innerHTML = '';

        // Add options for each job
        this.jobs.forEach(job => {
            const option1 = document.createElement('option');
            option1.value = job.id;
            option1.textContent = job.name;

            const option2 = document.createElement('option');
            option2.value = job.id;
            option2.textContent = job.name;

            jobSelect.appendChild(option1);
            viewJobSelect.appendChild(option2);
        });

        // Set current job in view select
        if (this.currentJobId) {
            viewJobSelect.value = this.currentJobId;
        }
    }

    populateChartViewDropdown() {
        const dropdown = document.getElementById('chartViewDropdown');

        // Clear existing options except the "Overall" option
        const overallOption = dropdown.querySelector('[data-view="overall"]');
        dropdown.innerHTML = '';
        dropdown.appendChild(overallOption);

        // Add options for each job
        this.jobs.forEach(job => {
            const option = document.createElement('a');
            option.href = '#';
            option.setAttribute('data-view', 'job');
            option.setAttribute('data-job-id', job.id);
            option.textContent = job.name;

            if (this.currentChartView === job.id) {
                option.classList.add('active');
                overallOption.classList.remove('active');
                document.getElementById('chartViewBtn').textContent = job.name + ' ▼';
            }

            dropdown.appendChild(option);
        });

        // If current view is overall, make sure it's active
        if (this.currentChartView === 'overall') {
            overallOption.classList.add('active');
            document.getElementById('chartViewBtn').textContent = 'Overall ▼';
        }
    }

    populateJobsList() {
        const jobsList = document.getElementById('jobsList');
        jobsList.innerHTML = '';

        this.jobs.forEach(job => {
            const jobItem = document.createElement('div');
            jobItem.className = 'job-item';

            const jobInfo = document.createElement('div');
            jobInfo.className = 'job-info';

            const jobName = document.createElement('div');
            jobName.className = 'job-name';
            jobName.textContent = job.name;

            const jobBaseRate = document.createElement('div');
            jobBaseRate.className = 'job-base-rate';
            jobBaseRate.textContent = `Base: ${job.baseRate} UAH for ${job.baseHours} hours (${(job.baseRate / job.baseHours).toFixed(2)} UAH/hour)`;

            jobInfo.appendChild(jobName);
            jobInfo.appendChild(jobBaseRate);

            const jobActions = document.createElement('div');
            jobActions.className = 'job-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-job-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => this.openEditJobModal(job));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-job-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteJob(job.id));

            jobActions.appendChild(editBtn);
            jobActions.appendChild(deleteBtn);

            jobItem.appendChild(jobInfo);
            jobItem.appendChild(jobActions);

            jobsList.appendChild(jobItem);
        });
    }

    openEditJobModal(job) {
        document.getElementById('editJobId').value = job.id;
        document.getElementById('editJobName').value = job.name;
        document.getElementById('editJobBaseRate').value = job.baseRate;
        document.getElementById('editJobBaseHours').value = job.baseHours;

        document.getElementById('editJobModal').style.display = 'block';
    }

    saveJobEdit() {
        const jobId = document.getElementById('editJobId').value;
        const jobName = document.getElementById('editJobName').value;
        const baseRate = parseFloat(document.getElementById('editJobBaseRate').value);
        const baseHours = parseFloat(document.getElementById('editJobBaseHours').value);

        const jobIndex = this.jobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex].name = jobName;
            this.jobs[jobIndex].baseRate = baseRate;
            this.jobs[jobIndex].baseHours = baseHours;

            this.saveData();
            this.populateJobSelects();
            this.populateChartViewDropdown();
            this.populateJobsList();
            this.updateStatistics();
            this.updateSalaryHistory();
            this.updateBaseRatesInfo();

            // If this job is the current chart view, update the button text
            if (this.currentChartView === jobId) {
                document.getElementById('chartViewBtn').textContent = jobName + ' ▼';
            }

            document.getElementById('editJobModal').style.display = 'none';
        }
    }

    addNewJob() {
        const jobName = document.getElementById('newJobName').value;
        const baseRate = parseFloat(document.getElementById('newJobBaseRate').value);
        const baseHours = parseFloat(document.getElementById('newJobBaseHours').value);

        const newJob = {
            id: this.generateId(),
            name: jobName,
            baseRate: baseRate,
            baseHours: baseHours
        };

        this.jobs.push(newJob);
        this.saveData();

        // Reset form
        document.getElementById('newJobName').value = '';
        document.getElementById('newJobBaseRate').value = '10395';
        document.getElementById('newJobBaseHours').value = '192';

        // Update UI
        this.populateJobSelects();
        this.populateChartViewDropdown();
        this.populateJobsList();
        this.updateBaseRatesInfo();

        // If this is the first job, set it as current
        if (this.jobs.length === 1) {
            this.currentJobId = newJob.id;
            this.updateStatistics();
        }
    }

    deleteJob(jobId) {
        // Check if job has entries
        const hasEntries = this.entries.some(entry => entry.jobId === jobId);

        if (hasEntries) {
            if (!confirm(`This job has salary entries. Deleting it will also delete all associated entries. Continue?`)) {
                return;
            }

            // Remove associated entries
            this.entries = this.entries.filter(entry => entry.jobId !== jobId);
        } else if (!confirm('Are you sure you want to delete this job?')) {
            return;
        }

        // Remove the job
        this.jobs = this.jobs.filter(job => job.id !== jobId);

        // If deleted job was current, set a new current job
        if (this.currentJobId === jobId && this.jobs.length > 0) {
            this.currentJobId = this.jobs[0].id;
        } else if (this.jobs.length === 0) {
            this.currentJobId = null;
        }

        // If deleted job was current chart view, reset to overall
        if (this.currentChartView === jobId) {
            this.currentChartView = 'overall';
            document.getElementById('chartViewBtn').textContent = 'Overall ▼';

            // Update active class in dropdown
            const links = document.querySelectorAll('#chartViewDropdown a');
            links.forEach(link => link.classList.remove('active'));
            document.querySelector('#chartViewDropdown [data-view="overall"]').classList.add('active');
        }

        this.saveData();
        this.populateJobSelects();
        this.populateChartViewDropdown();
        this.populateJobsList();
        this.updateSalaryHistory();
        this.updateGeneralAnalytics();
        this.updateChart();
        this.updateStatistics();
        this.updateBaseRatesInfo();
    }

    addSalaryEntry() {
        const jobId = document.getElementById('jobSelect').value;
        const monthYearInput = document.getElementById('monthYearInput').value; // Get value from new input
        const salary = parseFloat(document.getElementById('salary').value);
        const hours = parseFloat(document.getElementById('hours').value);

        // Check if entry for this job and month already exists
        const existingEntryIndex = this.entries.findIndex(entry =>
            entry.jobId === jobId && entry.month === monthYearInput
        );

        if (existingEntryIndex !== -1) {
            if (confirm(`An entry for this job and month already exists. Do you want to update it?`)) {
                this.entries[existingEntryIndex].salary = salary;
                this.entries[existingEntryIndex].hours = hours;
            } else {
                return;
            }
        } else {
            // Add new entry
            this.entries.push({
                id: this.generateId(),
                jobId,
                month: monthYearInput, // Use the combined month-year string
                salary,
                hours
            });
        }

        this.saveData();

        // Switch to the job that was just added
        this.currentJobId = jobId;
        document.getElementById('viewJobSelect').value = jobId;

        // Update UI
        this.updateSalaryHistory();
        this.updateGeneralAnalytics();
        this.updateChart();
        this.updateStatistics();

        // Clear form
        document.getElementById('salary').value = '';
        this.setDefaultMonthYear(); // Call the updated function
    }

    setDefaultMonthYear() {
        const monthYearInput = document.getElementById('monthYearInput');

        // Get all months for the current job
        const jobEntries = this.entries.filter(entry => entry.jobId === this.currentJobId);
        const months = jobEntries.map(entry => entry.month).sort();

        if (months.length > 0) {
            const lastMonth = months[months.length - 1];
            const [year, month] = lastMonth.split('-');
            let nextMonth = parseInt(month) + 1;
            let nextYear = parseInt(year);

            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear++;
            }

            const nextMonthValue = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
            monthYearInput.value = nextMonthValue; // Set the value of the month input
        } else {
            // If no entries, set to current month/year
            const today = new Date();
            const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
            const currentYear = today.getFullYear();
            monthYearInput.value = `${currentYear}-${currentMonth}`;
        }
    }

    getCurrentJobEntry() {
        if (!this.currentJobId) return null;

        // Get form data if available
        const monthYearInput = document.getElementById('monthYearInput').value;
        const salary = parseFloat(document.getElementById('salary').value) || 0;
        const hours = parseFloat(document.getElementById('hours').value) || 0;
        const jobId = document.getElementById('jobSelect').value;

        if (monthYearInput && salary && hours && jobId === this.currentJobId) {
            return { month: monthYearInput, salary, hours, jobId };
        }

        // If no current entry in form, get the latest entry for the current job
        const jobEntries = this.entries.filter(entry => entry.jobId === this.currentJobId);
        if (jobEntries.length === 0) return null;

        // Sort by month (newest first)
        jobEntries.sort((a, b) => b.month.localeCompare(a.month));
        return jobEntries[0];
    }

    updateStatistics() {
        const currentEntry = this.getCurrentJobEntry();
        const currentJob = this.jobs.find(job => job.id === this.currentJobId);

        if (!currentEntry || !currentJob) {
            document.getElementById('currentSalary').textContent = '-';
            document.getElementById('currentHours').textContent = '-';
            document.getElementById('currentHourlyRate').textContent = '-';
            document.getElementById('currentDifference').textContent = '-';
            return;
        }

        const { salary, hours } = currentEntry;
        const hourlyRate = salary / hours;
        const baseHourlyRate = currentJob.baseRate / currentJob.baseHours;

        // Calculate base salary proportional to hours worked
        const baseSalaryForHours = baseHourlyRate * hours;
        const difference = salary - baseSalaryForHours;

        document.getElementById('currentSalary').textContent = `${salary.toFixed(2)} UAH`;
        document.getElementById('currentHours').textContent = `${hours} hours`;

        const hourlyRateElement = document.getElementById('currentHourlyRate');
        const hourlyRateClass = hourlyRate > baseHourlyRate ? 'positive' : 'negative';
        hourlyRateElement.textContent = `${hourlyRate.toFixed(2)} UAH/hour`;
        hourlyRateElement.className = 'tooltip-trigger ' + hourlyRateClass;
        hourlyRateElement.setAttribute('data-tooltip', `Base Hourly: ${baseHourlyRate.toFixed(2)} UAH/hour`);

        const differenceElement = document.getElementById('currentDifference');
        differenceElement.textContent = `${difference >= 0 ? '+' : ''}${difference.toFixed(2)} UAH`;
        differenceElement.className = 'tooltip-trigger ' + (difference >= 0 ? 'positive' : 'negative');
        differenceElement.setAttribute('data-tooltip', `Base Salary (for hours): ${baseSalaryForHours.toFixed(2)} UAH`);
    }

    updateSalaryHistory() {
        const tableBody = document.querySelector('#salaryHistoryTable tbody');
        tableBody.innerHTML = '';

        // Get filtered entries based on analytics settings
        const filteredEntries = this.getFilteredEntriesForAnalytics();

        // Sort entries by month (newest first)
        filteredEntries.sort((a, b) => b.month.localeCompare(a.month));

        // Group entries by job for calculating percentage changes
        const entriesByJob = {};
        filteredEntries.forEach(entry => {
            if (!entriesByJob[entry.jobId]) {
                entriesByJob[entry.jobId] = [];
            }
            entriesByJob[entry.jobId].push(entry);
        });

        // Sort entries within each job by month (oldest first) for percentage calculation
        Object.keys(entriesByJob).forEach(jobId => {
            entriesByJob[jobId].sort((a, b) => a.month.localeCompare(b.month));
        });

        filteredEntries.forEach(entry => {
            const job = this.jobs.find(j => j.id === entry.jobId);
            if (!job) return;

            const row = document.createElement('tr');

            // Format month for display
            const [year, month] = entry.month.split('-');
            const date = new Date(year, month - 1);
            const formattedMonth = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            // Calculate hourly rate and differences
            const hourlyRate = entry.salary / entry.hours;
            const baseHourlyRate = job.baseRate / job.baseHours;
            const baseSalaryForHours = baseHourlyRate * entry.hours;
            const salaryDiff = entry.salary - baseSalaryForHours;
            const rateDiff = hourlyRate - baseHourlyRate;

            // Find previous entry for the same job to calculate percentage change
            const jobEntries = entriesByJob[entry.jobId];
            const entryIndex = jobEntries.findIndex(e => e.id === entry.id);
            const prevEntry = entryIndex > 0 ? jobEntries[entryIndex - 1] : null;

            // Calculate percentage changes if previous entry exists
            let salaryPercentChange = null;
            let hourlyRatePercentChange = null;

            if (prevEntry) {
                const prevSalary = prevEntry.salary;
                const prevHourlyRate = prevEntry.salary / prevEntry.hours;

                salaryPercentChange = ((entry.salary - prevSalary) / prevSalary) * 100;
                hourlyRatePercentChange = ((hourlyRate - prevHourlyRate) / prevHourlyRate) * 100;
            }

            // Create cells
            const monthCell = document.createElement('td');
            monthCell.textContent = formattedMonth;

            const jobCell = document.createElement('td');
            jobCell.textContent = job.name;

            const salaryCell = document.createElement('td');
            salaryCell.classList.add('salary-cell-content', 'numeric');
            const salaryValueSpan = document.createElement('span');
            salaryValueSpan.textContent = `${entry.salary.toFixed(2)} UAH`;
            salaryCell.appendChild(salaryValueSpan);

            // Add percentage change indicator for salary
            if (salaryPercentChange !== null) {
                const percentSpan = document.createElement('span');
                percentSpan.className = salaryPercentChange >= 0 ? 'percent-change positive' : 'percent-change negative';

                // Create SVG arrow
                const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgIcon.classList.add('arrow-icon');
                svgIcon.setAttribute('width', '12');
                svgIcon.setAttribute('height', '12');

                const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                useElement.setAttribute('href',
                    salaryPercentChange >= 0 ? '#arrow-up' : '#arrow-down');

                svgIcon.appendChild(useElement);
                percentSpan.appendChild(svgIcon);

                // Add percentage text
                const percentText = document.createTextNode(` ${salaryPercentChange >= 0 ? '+' : ''}${salaryPercentChange.toFixed(1)}%`);
                percentSpan.appendChild(percentText);

                salaryCell.appendChild(percentSpan);
            }

            const hoursCell = document.createElement('td');
            hoursCell.textContent = entry.hours;
            hoursCell.classList.add('numeric');

            const hourlyRateCell = document.createElement('td');
            hourlyRateCell.innerHTML = `${hourlyRate.toFixed(2)} UAH/h`;
            hourlyRateCell.classList.add('numeric');

            const salaryDiffCell = document.createElement('td');
            salaryDiffCell.textContent = `${salaryDiff >= 0 ? '+' : ''}${salaryDiff.toFixed(2)}`;
            salaryDiffCell.className = salaryDiff >= 0 ? 'positive numeric' : 'negative numeric';

            const rateDiffCell = document.createElement('td');
            rateDiffCell.textContent = `${rateDiff >= 0 ? '+' : ''}${rateDiff.toFixed(2)} UAH/h`;
            rateDiffCell.className = rateDiff >= 0 ? 'positive numeric' : 'negative numeric';

            const actionCell = document.createElement('td');
            
            // Create edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => this.openEditEntryModal(entry));
            actionCell.appendChild(editBtn);
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteEntry(entry.id));
            actionCell.appendChild(deleteBtn);

            // Append cells to row
            row.appendChild(monthCell);
            row.appendChild(jobCell);
            row.appendChild(salaryCell);
            row.appendChild(hoursCell);
            row.appendChild(hourlyRateCell);
            row.appendChild(salaryDiffCell);
            row.appendChild(rateDiffCell);
            row.appendChild(actionCell);

            // Append row to table
            tableBody.appendChild(row);
        });
    }

    openEditEntryModal(entry) {
        // Populate the edit entry form with current values
        document.getElementById('editEntryId').value = entry.id;
        
        const editEntryJobSpan = document.getElementById('editEntryJob');
        const editEntryJobHidden = document.getElementById('editEntryJobHidden');
        const job = this.jobs.find(j => j.id === entry.jobId);
        if (job) {
            editEntryJobSpan.textContent = job.name;
            editEntryJobHidden.value = job.id; // Store the job ID in the hidden input
        }
        
        // Set the combined month/year value
        document.getElementById('editEntryMonthYear').value = entry.month;
        
        document.getElementById('editEntrySalary').value = entry.salary;
        document.getElementById('editEntryHours').value = entry.hours;

        // Show the modal
        document.getElementById('editEntryModal').style.display = 'block';
    }

    saveEntryEdit() {
        const entryId = document.getElementById('editEntryId').value;
        const jobId = document.getElementById('editEntryJobHidden').value; // Get jobId from hidden input
        const monthYear = document.getElementById('editEntryMonthYear').value; // Get combined month/year
        const salary = parseFloat(document.getElementById('editEntrySalary').value);
        const hours = parseFloat(document.getElementById('editEntryHours').value);

        // Check if another entry exists for this job and month (excluding current entry)
        const existingEntry = this.entries.find(entry => 
            entry.jobId === jobId && 
            entry.month === monthYear && 
            entry.id !== entryId
        );

        if (existingEntry) {
            alert('An entry for this job and month already exists. Please choose a different month or job.');
            return;
        }

        // Find and update the entry
        const entryIndex = this.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex !== -1) {
            this.entries[entryIndex].jobId = jobId;
            this.entries[entryIndex].month = monthYear;
            this.entries[entryIndex].salary = salary;
            this.entries[entryIndex].hours = hours;

            this.saveData();
            this.updateSalaryHistory();
            this.updateGeneralAnalytics();
            this.updateChart();
            this.updateStatistics();

            // Close the modal
            document.getElementById('editEntryModal').style.display = 'none';
        }
    }

    deleteEntry(entryId) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries = this.entries.filter(entry => entry.id !== entryId);
            this.saveData();
            this.updateSalaryHistory();
            this.updateGeneralAnalytics();
            this.updateChart();
            this.updateStatistics();
        }
    }

    updateGeneralAnalytics() {
        // Use the analytics settings filter instead of the chart period filter
        const filteredEntries = this.getFilteredEntriesForAnalytics();

        // Calculate total income and hours
        let totalIncome = 0;
        let totalHours = 0;

        filteredEntries.forEach(entry => {
            totalIncome += entry.salary;
            totalHours += entry.hours;
        });

        // Calculate average hourly rate
        const averageRate = totalHours > 0 ? totalIncome / totalHours : 0;

        // Update the UI
        document.getElementById('totalIncome').textContent = `${totalIncome.toFixed(2)} UAH`;
        document.getElementById('totalHours').textContent = `${totalHours.toFixed(2)}`;
        document.getElementById('averageRate').textContent = `${averageRate.toFixed(2)} UAH/hour`;

        // Update the gear animation to indicate custom settings are applied
        const gearAnimation = document.getElementById('gearAnimation');
        const hasCustomSettings = this.analyticsSettings.includedJobs.length < this.jobs.length ||
            this.analyticsSettings.period !== 'all';

        if (hasCustomSettings) {
            gearAnimation.classList.add('active-settings');

            // Add tooltip to show current settings
            gearAnimation.setAttribute('data-tooltip', this.getAnalyticsSummary());
        } else {
            gearAnimation.classList.remove('active-settings');
            gearAnimation.removeAttribute('data-tooltip');
        }
    }

    updateBaseRatesInfo() {
        const container = document.getElementById('baseRatesContainer');
        container.innerHTML = '';

        this.jobs.forEach(job => {
            const baseHourlyRate = job.baseRate / job.baseHours;

            const baseRateItem = document.createElement('div');
            baseRateItem.className = 'base-rate-item';
            baseRateItem.textContent = `${job.name}: ${job.baseRate} UAH for ${job.baseHours} hours | ${baseHourlyRate.toFixed(2)} UAH/hour`;

            container.appendChild(baseRateItem);
        });
    }

    getFilteredEntries() {
        if (this.currentPeriod === 'all') {
            return [...this.entries];
        }

        const now = new Date();
        let cutoffDate;

        switch (this.currentPeriod) {
            case 'year':
                cutoffDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
                break;
            case '6months':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
            case '3months':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            default:
                return [...this.entries];
        }

        return this.entries.filter(entry => {
            const [year, month] = entry.month.split('-');
            const entryDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            return entryDate >= cutoffDate;
        });
    }

    setupChart() {
        const ctx = document.getElementById('salaryChart').getContext('2d');

        // Set up Chart.js with dark theme
        Chart.defaults.color = '#e0e0e0';
        Chart.defaults.borderColor = '#34495e';

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Monthly Income',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4CAF50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        grid: {
                            color: '#2c3e50'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (UAH)'
                        },
                        grid: {
                            color: '#2c3e50'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e0e0e0',
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: '#34495e',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#2c3e50',
                        borderWidth: 1
                    }
                }
            }
        });

        this.updateChart();
    }

    updateChart() {
        const filteredEntries = this.getFilteredEntriesForAnalytics(); // Use analytics settings for filtering
        const chartType = document.querySelector('input[name="chartType"]:checked').value;

        // Get all months
        const allMonths = [...new Set(filteredEntries.map(entry => entry.month))].sort();

        // Format month labels
        const labels = allMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        });

        // Prepare datasets based on view mode
        if (this.currentChartView === 'overall') {
            // Overall view - single dataset for all jobs
            if (this.chart.data.datasets.length !== 1) {
                // Reset to single dataset if previously showing multiple
                this.chart.data.datasets = [{
                    label: chartType === 'salary' ? 'Monthly Income' : 'Hourly Rate',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4CAF50'
                }];
            }

            let chartData;

            if (chartType === 'salary') {
                // Monthly salary data - sum all jobs for each month
                chartData = allMonths.map(month => {
                    const monthEntries = filteredEntries.filter(entry => entry.month === month);
                    return monthEntries.reduce((sum, entry) => sum + entry.salary, 0);
                });

                this.chart.options.scales.y.title.text = 'Total Salary (UAH)';
                this.chart.data.datasets[0].label = 'Monthly Income';
            } else {
                // Hourly rate data - weighted average for each month
                chartData = allMonths.map(month => {
                    const monthEntries = filteredEntries.filter(entry => entry.month === month);
                    const totalSalary = monthEntries.reduce((sum, entry) => sum + entry.salary, 0);
                    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);
                    return totalHours > 0 ? totalSalary / totalHours : 0;
                });

                this.chart.options.scales.y.title.text = 'Average Hourly Rate (UAH/hour)';
                this.chart.data.datasets[0].label = 'Hourly Rate';
            }

            // Update chart data
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = chartData;
        } else {
            // Job-specific view
            const selectedJobId = this.currentChartView;
            const selectedJob = this.jobs.find(job => job.id === selectedJobId);

            if (!selectedJob) {
                // No job selected, show empty chart
                this.chart.data.labels = [];
                this.chart.data.datasets = [{
                    label: 'No Data',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }];
            } else {
                // Filter entries for selected job
                const jobEntries = filteredEntries.filter(entry => entry.jobId === selectedJobId);

                // Get months for this job
                const jobMonths = [...new Set(jobEntries.map(entry => entry.month))].sort();

                // Format job month labels
                const jobLabels = jobMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const date = new Date(year, monthNum - 1);
                    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                });

                let jobData;

                if (chartType === 'salary') {
                    // Monthly salary data for specific job
                    jobData = jobMonths.map(month => {
                        const entry = jobEntries.find(entry => entry.month === month);
                        return entry ? entry.salary : 0;
                    });

                    this.chart.options.scales.y.title.text = 'Salary (UAH)';

                    // Create datasets
                    this.chart.data.datasets = [{
                        label: `${selectedJob.name} - Salary`,
                        data: jobData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Base Salary (Proportional)',
                        data: jobMonths.map(month => {
                            const entry = jobEntries.find(entry => entry.month === month);
                            if (!entry) return 0;
                            const baseHourlyRate = selectedJob.baseRate / selectedJob.baseHours;
                            return baseHourlyRate * entry.hours;
                        }),
                        borderColor: '#e74c3c',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0,
                        fill: false
                    }];
                } else {
                    // Hourly rate data for specific job
                    jobData = jobMonths.map(month => {
                        const entry = jobEntries.find(entry => entry.month === month);
                        return entry ? entry.salary / entry.hours : 0;
                    });

                    this.chart.options.scales.y.title.text = 'Hourly Rate (UAH/hour)';

                    // Create datasets
                    this.chart.data.datasets = [{
                        label: `${selectedJob.name} - Hourly Rate`,
                        data: jobData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Base Hourly Rate',
                        data: jobMonths.map(() => selectedJob.baseRate / selectedJob.baseHours),
                        borderColor: '#e74c3c',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0,
                        fill: false
                    }];
                }

                // Update chart data
                this.chart.data.labels = jobLabels;
            }
        }

        this.chart.update();
    }

    setupTooltips() {
        const tooltip = document.getElementById('tooltip');

        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('tooltip-trigger')) {
                const tooltipText = e.target.getAttribute('data-tooltip');

                if (tooltipText) {
                    tooltip.textContent = tooltipText;
                    tooltip.classList.add('show');
                    this.positionTooltip(e, tooltip);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (tooltip.classList.contains('show')) {
                this.positionTooltip(e, tooltip);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('tooltip-trigger')) {
                tooltip.classList.remove('show');
            }
        });
    }

    positionTooltip(e, tooltip) {
        const rect = tooltip.getBoundingClientRect();
        let left = e.pageX + 10;
        let top = e.pageY - rect.height - 10;

        if (left + rect.width > window.innerWidth) {
            left = e.pageX - rect.width - 10;
        }

        if (top < 0) {
            top = e.pageY + 10;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveData() {
        localStorage.setItem('salaryTrackerJobs', JSON.stringify(this.jobs));
        localStorage.setItem('salaryTrackerEntries', JSON.stringify(this.entries));
        localStorage.setItem('salaryTrackerAnalyticsSettings', JSON.stringify(this.analyticsSettings));
    }

    loadData() {
        const savedJobs = localStorage.getItem('salaryTrackerJobs');
        const savedEntries = localStorage.getItem('salaryTrackerEntries');
        const savedAnalyticsSettings = localStorage.getItem('salaryTrackerAnalyticsSettings');

        if (savedJobs) {
            this.jobs = JSON.parse(savedJobs);
        }

        if (savedEntries) {
            this.entries = JSON.parse(savedEntries);
        }

        if (savedAnalyticsSettings) {
            this.analyticsSettings = JSON.parse(savedAnalyticsSettings);
        }

        // Migrate old data format if needed
        this.migrateOldData();
    }

    migrateOldData() {
        const oldData = localStorage.getItem('salaryTrackerData');
        if (!oldData) return;

        try {
            const parsedData = JSON.parse(oldData);

            // Check if we need to migrate (if we have no entries but old data exists)
            if (this.entries.length === 0 && parsedData) {
                // Create default jobs if they don't exist
                if (this.jobs.length === 0) {
                    this.setupDefaultJobs();
                }

                const mainJobId = this.jobs.find(job => job.name === 'Main Job')?.id;
                const secondJobId = this.jobs.find(job => job.name === 'Second Job')?.id;
                const sideJobId = this.jobs.find(job => job.name === 'Side Jobs')?.id;

                // Migrate main job data
                if (mainJobId && parsedData.main) {
                    Object.entries(parsedData.main).forEach(([month, data]) => {
                        this.entries.push({
                            id: this.generateId(),
                            jobId: mainJobId,
                            month,
                            salary: data.salary,
                            hours: data.hours
                        });
                    });
                }

                // Migrate second job data
                if (secondJobId && parsedData.second) {
                    Object.entries(parsedData.second).forEach(([month, data]) => {
                        this.entries.push({
                            id: this.generateId(),
                            jobId: secondJobId,
                            month,
                            salary: data.salary,
                            hours: data.hours
                        });
                    });
                }

                // Migrate side jobs data
                if (sideJobId && parsedData.side) {
                    Object.entries(parsedData.side).forEach(([month, data]) => {
                        this.entries.push({
                            id: this.generateId(),
                            jobId: sideJobId,
                            month,
                            salary: data.salary,
                            hours: data.hours
                        });
                    });
                }

                // Save the migrated data
                this.saveData();

                // Remove old data format
                localStorage.removeItem('salaryTrackerData');
            }
        } catch (error) {
            console.error('Error migrating old data:', error);
        }
    }
    // Populate Analytics Settings Modal
    populateAnalyticsSettingsModal() {
        // Set period select to current value
        document.getElementById('analyticsPeriodSelect').value = this.analyticsSettings.period;

        // Show/hide custom date range based on period
        const customDateRange = document.getElementById('customDateRange');
        customDateRange.style.display = this.analyticsSettings.period === 'custom' ? 'block' : 'none';

        // Set custom date values if they exist
        if (this.analyticsSettings.customStartDate) {
            document.getElementById('customStartDate').value = this.analyticsSettings.customStartDate;
        }
        if (this.analyticsSettings.customEndDate) {
            document.getElementById('customEndDate').value = this.analyticsSettings.customEndDate;
        }

        // Set data type radio
        document.querySelector(`input[name="analyticsDataType"][value="${this.analyticsSettings.dataType}"]`).checked = true;

        // Populate job checkboxes
        this.populateJobCheckboxes();
    }

    // Populate job checkboxes in analytics settings
    populateJobCheckboxes() {
        const jobsContainer = document.getElementById('analyticsJobsContainer');
        jobsContainer.innerHTML = '';

        // If no jobs are explicitly included, include all by default
        const includedJobs = this.analyticsSettings.includedJobs.length > 0
            ? this.analyticsSettings.includedJobs
            : this.jobs.map(job => job.id);

        // Sort jobs alphabetically for better organization
        const sortedJobs = [...this.jobs].sort((a, b) => a.name.localeCompare(b.name));

        sortedJobs.forEach(job => {
            const jobLabel = document.createElement('label');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = job.id;
            checkbox.checked = includedJobs.includes(job.id);
            checkbox.id = `job-checkbox-${job.id}`;

            const labelText = document.createTextNode(job.name);

            jobLabel.appendChild(checkbox);
            jobLabel.appendChild(labelText);

            jobsContainer.appendChild(jobLabel);
        });
    }

    // Select or deselect all jobs
    selectAllJobs(selectAll) {
        const checkboxes = document.querySelectorAll('#analyticsJobsContainer input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
    }

    // Reset analytics settings to default
    resetAnalyticsSettings() {
        // Reset to default values
        this.analyticsSettings = {
            period: 'all',
            customStartDate: null,
            customEndDate: null,
            includedJobs: this.jobs.map(job => job.id), // Include all jobs
            dataType: 'overall'
        };

        // Update the modal UI
        this.populateAnalyticsSettingsModal();

        // Update analytics immediately
        this.updateGeneralAnalytics();
        this.updateChart(); // Also update the chart
        this.updateSalaryHistory(); // Also update the salary history
    }

    // Apply Analytics Settings
    applyAnalyticsSettings() {
        // Get period
        const periodSelect = document.getElementById('analyticsPeriodSelect');
        this.analyticsSettings.period = periodSelect.value;

        // Get custom date range if applicable
        if (this.analyticsSettings.period === 'custom') {
            this.analyticsSettings.customStartDate = document.getElementById('customStartDate').value;
            this.analyticsSettings.customEndDate = document.getElementById('customEndDate').value;
        } else {
            this.analyticsSettings.customStartDate = null;
            this.analyticsSettings.customEndDate = null;
        }

        // Get data type
        const dataTypeRadio = document.querySelector('input[name="analyticsDataType"]:checked');
        this.analyticsSettings.dataType = dataTypeRadio.value;

        // Get included jobs
        this.analyticsSettings.includedJobs = [];
        const jobCheckboxes = document.querySelectorAll('#analyticsJobsContainer input[type="checkbox"]:checked');
        jobCheckboxes.forEach(checkbox => {
            this.analyticsSettings.includedJobs.push(checkbox.value);
        });

        // Update analytics with new settings
        this.updateGeneralAnalytics();
        this.updateChart(); // Also update the chart
    }

    // Get filtered entries based on analytics settings
    getFilteredEntriesForAnalytics() {
        let filteredEntries = [...this.entries];

        // Filter by job if specific jobs are included
        if (this.analyticsSettings.includedJobs.length > 0) {
            filteredEntries = filteredEntries.filter(entry =>
                this.analyticsSettings.includedJobs.includes(entry.jobId)
            );
        }

        // Filter by period
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        switch (this.analyticsSettings.period) {
            case 'year':
                // Filter to current year
                filteredEntries = filteredEntries.filter(entry => {
                    const [year] = entry.month.split('-');
                    return parseInt(year) === currentYear;
                });
                break;

            case '6months':
                // Filter to last 6 months
                filteredEntries = filteredEntries.filter(entry => {
                    const [year, month] = entry.month.split('-').map(Number);
                    let monthsAgo = (currentYear - year) * 12 + (currentMonth - month);
                    return monthsAgo >= 0 && monthsAgo < 6;
                });
                break;

            case '3months':
                // Filter to last 3 months
                filteredEntries = filteredEntries.filter(entry => {
                    const [year, month] = entry.month.split('-').map(Number);
                    let monthsAgo = (currentYear - year) * 12 + (currentMonth - month);
                    return monthsAgo >= 0 && monthsAgo < 3;
                });
                break;

            case 'custom':
                // Filter to custom date range
                if (this.analyticsSettings.customStartDate && this.analyticsSettings.customEndDate) {
                    filteredEntries = filteredEntries.filter(entry => {
                        return entry.month >= this.analyticsSettings.customStartDate &&
                            entry.month <= this.analyticsSettings.customEndDate;
                    });
                }
                break;

            // case 'all': - no filtering needed
        }

        return filteredEntries;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SalaryTracker();
    app.setupTooltips(); // Initialize tooltips
});
