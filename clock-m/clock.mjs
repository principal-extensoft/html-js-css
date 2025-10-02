/**
 * Health Clock Widget - ES6 Module
 * A 24-hour analog clock visualization for system health monitoring
 * with configurable comet trail effects, interactive pinning, and flexible data providers
 */

export class HealthClock {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        // Configuration with defaults
        this.config = {
            // Comet trail configuration
            cometTailLength: options.cometTailLength || 6,
            cometFalloffRate: options.cometFalloffRate || 0.7,
            
            // Brightness levels
            baseBrightness: options.baseBrightness || 0.4,
            oppositePeriodBrightness: options.oppositePeriodBrightness || 0.15,
            cometBrightnessBoost: options.cometBrightnessBoost || 0.6,
            currentHourBrightness: options.currentHourBrightness || 1.0,
            futureHourBrightness: options.futureHourBrightness || 0.1,
            
            // Interactivity
            disableFutureHours: options.disableFutureHours !== undefined ? options.disableFutureHours : true,
            
            // Data configuration
            dataProvider: options.dataProvider || 'default', // 'default', 'api', 'mock', or custom function
            apiConfig: options.apiConfig || {
                url: '/api/health/hourly',
                method: 'GET',
                headers: {},
                transformData: null // Function to transform API response
            },
            mockProvider: options.mockProvider || 'realistic', // 'realistic', 'incident', 'maintenance', 'custom'
            
            // Update interval (milliseconds)
            updateInterval: options.updateInterval || 1000,
            dataRefreshInterval: options.dataRefreshInterval || 300000, // 5 minutes
            
            // Callbacks
            onHourHover: options.onHourHover || null,
            onHourClick: options.onHourClick || null,
            onHourPin: options.onHourPin || null,
            onDataUpdate: options.onDataUpdate || null,
            onDataError: options.onDataError || null
        };
        
        // Internal state
        this.pinnedHour = null;
        this.currentHour = new Date().getHours();
        this.updateTimer = null;
        this.dataRefreshTimer = null;
        this.healthData = [];
        
        // Cache DOM elements
        this.detailsContainer = null;
        
        // Bind methods
        this.togglePin = this.togglePin.bind(this);
        this.updateCurrentTime = this.updateCurrentTime.bind(this);
        this.refreshData = this.refreshData.bind(this);
        
        // Make togglePin globally accessible for onclick handlers
        window.togglePin = this.togglePin;
        
        this.init();
    }
    
    /**
     * Initialize the health clock widget
     */
    async init() {
        this.createClockStructure();
        await this.loadInitialData();
        this.generateClockFace();
        this.startUpdateTimer();
        this.startDataRefreshTimer();
    }
    
    /**
     * Load initial data based on the configured data provider
     */
    async loadInitialData() {
        try {
            this.healthData = await this.fetchHealthData();
            
            if (this.config.onDataUpdate) {
                this.config.onDataUpdate(this.healthData);
            }
        } catch (error) {
            console.error('Failed to load initial health data:', error);
            
            if (this.config.onDataError) {
                this.config.onDataError(error);
            }
            
            // Fallback to default data
            this.healthData = this.getDefaultHealthData();
        }
    }
    
    /**
     * Fetch health data based on the configured provider
     */
    async fetchHealthData() {
        switch (this.config.dataProvider) {
            case 'api':
                return await this.fetchFromAPI();
            case 'mock':
                return await this.fetchFromMockProvider();
            case 'default':
                return this.getDefaultHealthData();
            default:
                // Custom function provider
                if (typeof this.config.dataProvider === 'function') {
                    return await this.config.dataProvider();
                }
                throw new Error(`Unknown data provider: ${this.config.dataProvider}`);
        }
    }
    
    /**
     * Fetch data from API endpoint
     */
    async fetchFromAPI() {
        const { url, method, headers, transformData } = this.config.apiConfig;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        let data = await response.json();
        
        // Transform data if transform function is provided
        if (transformData && typeof transformData === 'function') {
            data = transformData(data);
        } else {
            // Default transformation - ensure data is in expected format
            data = this.transformToStandardFormat(data);
        }
        
        return data;
    }
    
    /**
     * Fetch data from mock provider
     */
    async fetchFromMockProvider() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
        
        switch (this.config.mockProvider) {
            case 'realistic':
                return this.getMockRealisticData();
            case 'incident':
                return this.getMockIncidentData();
            case 'maintenance':
                return this.getMockMaintenanceData();
            case 'outage':
                return this.getMockOutageData();
            case 'custom':
                return this.getMockCustomData();
            default:
                if (typeof this.config.mockProvider === 'function') {
                    return this.config.mockProvider();
                }
                return this.getMockRealisticData();
        }
    }
    
    /**
     * Transform various data formats to standard format
     */
    transformToStandardFormat(data) {
        // Handle different potential data structures
        if (Array.isArray(data)) {
            // Already an array, ensure each item has required fields
            return data.map((item, index) => ({
                hour: item.hour !== undefined ? item.hour : index,
                status: item.status || this.normalizeStatus(item),
                response: item.response || item.responseTime || item.latency || 'N/A',
                memory: item.memory || item.memoryUsage || item.ram || 'N/A',
                cpu: item.cpu || item.cpuUsage || item.processor || 'N/A',
                incidents: item.incidents !== undefined ? item.incidents : (item.errors || 0)
            }));
        } else if (data.hourlyData) {
            // Nested structure
            return this.transformToStandardFormat(data.hourlyData);
        } else if (data.metrics) {
            // Metrics-based structure
            return Object.keys(data.metrics).map(hour => ({
                hour: parseInt(hour),
                status: this.normalizeStatus(data.metrics[hour]),
                response: data.metrics[hour].responseTime || 'N/A',
                memory: data.metrics[hour].memory || 'N/A',
                cpu: data.metrics[hour].cpu || 'N/A',
                incidents: data.metrics[hour].incidents || 0
            }));
        }
        
        // Default fallback
        return this.getDefaultHealthData();
    }
    
    /**
     * Normalize various status formats to standard format
     */
    normalizeStatus(item) {
        const statusValue = item.status || item.health || item.state || 'unknown';
        
        if (typeof statusValue === 'string') {
            const normalized = statusValue.toLowerCase();
            if (['healthy', 'ok', 'good', 'green', 'up'].includes(normalized)) return 'healthy';
            if (['degraded', 'warning', 'yellow', 'slow'].includes(normalized)) return 'degraded';
            if (['unhealthy', 'error', 'critical', 'red', 'down'].includes(normalized)) return 'unhealthy';
        } else if (typeof statusValue === 'number') {
            if (statusValue >= 90) return 'healthy';
            if (statusValue >= 70) return 'degraded';
            return 'unhealthy';
        }
        
        return 'healthy'; // Default fallback
    }
    
    /**
     * Mock data providers for testing different scenarios
     */
    getMockRealisticData() {
        const baseData = this.getDefaultHealthData();
        
        // Add some realistic variation
        return baseData.map(item => ({
            ...item,
            response: this.addVariation(item.response, 0.1),
            memory: this.addVariation(item.memory, 0.05),
            cpu: this.addVariation(item.cpu, 0.15)
        }));
    }
    
    getMockIncidentData() {
        const data = this.getMockRealisticData();
        
        // Simulate an incident affecting hours 14-16
        [14, 15, 16].forEach(hour => {
            if (data[hour]) {
                data[hour].status = hour === 15 ? 'unhealthy' : 'degraded';
                data[hour].response = hour === 15 ? 'TIMEOUT' : '450ms';
                data[hour].incidents = hour === 15 ? 3 : 1;
            }
        });
        
        return data;
    }
    
    getMockMaintenanceData() {
        const data = this.getMockRealisticData();
        
        // Simulate maintenance window affecting hours 2-4
        [2, 3, 4].forEach(hour => {
            if (data[hour]) {
                data[hour].status = 'degraded';
                data[hour].response = '200ms';
                data[hour].memory = '2.1GB';
                data[hour].cpu = '25%';
                data[hour].incidents = 0;
            }
        });
        
        return data;
    }
    
    getMockOutageData() {
        const data = this.getMockRealisticData();
        
        // Simulate outage affecting hours 10-12
        [10, 11, 12].forEach(hour => {
            if (data[hour]) {
                data[hour].status = 'unhealthy';
                data[hour].response = 'TIMEOUT';
                data[hour].memory = 'N/A';
                data[hour].cpu = 'N/A';
                data[hour].incidents = 5;
            }
        });
        
        return data;
    }
    
    getMockCustomData() {
        // Override this method or pass a custom function for specific test scenarios
        return this.getDefaultHealthData();
    }
    
    /**
     * Add realistic variation to metric values
     */
    addVariation(value, factor) {
        if (typeof value !== 'string' || value === 'N/A' || value === 'TIMEOUT') {
            return value;
        }
        
        const numMatch = value.match(/(\d+\.?\d*)/);
        if (numMatch) {
            const num = parseFloat(numMatch[1]);
            const variation = num * factor * (Math.random() - 0.5) * 2;
            const newNum = Math.max(0, num + variation).toFixed(1);
            return value.replace(numMatch[1], newNum);
        }
        
        return value;
    }
    
    /**
     * Refresh data from the configured provider
     */
    async refreshData() {
        try {
            const newData = await this.fetchHealthData();
            this.updateHealthData(newData);
            
            if (this.config.onDataUpdate) {
                this.config.onDataUpdate(newData);
            }
        } catch (error) {
            console.error('Failed to refresh health data:', error);
            
            if (this.config.onDataError) {
                this.config.onDataError(error);
            }
        }
    }
    
    /**
     * Start the data refresh timer
     */
    startDataRefreshTimer() {
        if (this.config.dataRefreshInterval > 0) {
            this.dataRefreshTimer = setInterval(this.refreshData, this.config.dataRefreshInterval);
        }
    }
    
    /**
     * Stop the data refresh timer
     */
    stopDataRefreshTimer() {
        if (this.dataRefreshTimer) {
            clearInterval(this.dataRefreshTimer);
            this.dataRefreshTimer = null;
        }
    }
    
    /**
     * Create the basic HTML structure for the clock
     */
    createClockStructure() {
        this.container.innerHTML = `
            <div class="clock-container">
                <div class="health-clock" id="${this.containerId}-face">
                    <div class="clock-center">
                        <div class="current-time" id="${this.containerId}-time">--:--</div>
                        <div class="clock-dot"></div>
                    </div>
                </div>
                
                <div class="clock-details" id="${this.containerId}-details">
                    <div class="detail-content" id="${this.containerId}-content">
                        <div class="detail-placeholder">
                            <span class="clock-icon">🕒</span>
                            <p>Hover over any hour to see health details</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cache the details container
        this.detailsContainer = document.getElementById(`${this.containerId}-content`);
    }
    
    /**
     * Generate the 24-hour clock face with health status indicators
     */
    generateClockFace() {
        const clockFace = document.getElementById(`${this.containerId}-face`);
        const isAfternoon = this.currentHour >= 12;
        
        // Create hour segments for dual ring
        for (let hour = 0; hour < 24; hour++) {
            const segment = this.createHourSegment(hour, isAfternoon);
            clockFace.appendChild(segment);
        }
        
        this.updateCurrentTime();
    }
    
    /**
     * Create an individual hour segment
     */
    createHourSegment(hour, isAfternoon) {
        const segment = document.createElement('div');
        
        // Determine ring placement
        const isOuterRing = hour >= 1 && hour <= 12;
        const isInnerRing = hour >= 13 && hour <= 23;
        const isMidnight = hour === 0;
        
        // Set up classes
        segment.className = `hour-segment status-${this.healthData[hour].status}`;
        
        if (isOuterRing || isMidnight) {
            segment.classList.add('outer-ring');
        } else if (isInnerRing) {
            segment.classList.add('inner-ring');
        }
        
        // Apply comet trailing effect
        const cometOpacity = this.calculateCometOpacity(hour, this.currentHour, isAfternoon, isOuterRing, isInnerRing, isMidnight);
        
        // Determine if this hour is in the future
        const isFutureHour = this.isHourInFuture(hour, this.currentHour, isAfternoon, isOuterRing, isInnerRing, isMidnight);
        
        // Apply appropriate opacity (future hours get special treatment)
        if (this.config.disableFutureHours && isFutureHour) {
            segment.style.opacity = this.config.futureHourBrightness;
        } else {
            segment.style.opacity = cometOpacity;
        }
        
        // Add comet-trail class for hours in the trail (above base brightness)
        if (!isFutureHour && cometOpacity > this.config.baseBrightness) {
            segment.classList.add('comet-trail');
        }
        
        // Display military time numbers
        segment.textContent = hour.toString().padStart(2, '0');
        segment.dataset.hour = hour;
        
        // Calculate position on clock face
        this.positionSegment(segment, hour, isOuterRing, isInnerRing, isMidnight);
        
        // Mark current hour
        if (hour === this.currentHour) {
            segment.classList.add('current');
        }
        
        // Add event listeners only if not a future hour (or if future hours are enabled)
        if (!this.config.disableFutureHours || !isFutureHour) {
            segment.addEventListener('mouseenter', () => this.showHourDetails(hour));
            segment.addEventListener('mouseleave', () => {
                if (this.pinnedHour !== hour) this.hideHourDetails();
            });
            segment.addEventListener('click', () => this.handleHourClick(hour));
            segment.classList.add('interactive');
        } else {
            // Mark future hours as non-interactive
            segment.classList.add('future-hour');
            segment.style.cursor = 'default';
        }
        
        return segment;
    }
    
    /**
     * Position a segment on the clock face
     */
    positionSegment(segment, hour, isOuterRing, isInnerRing, isMidnight) {
        let radius, angle;
        
        if (isOuterRing || isMidnight) {
            // Outer ring: 1-12 positions (plus 00 at 12 o'clock)
            radius = 125;
            const displayHour = isMidnight ? 12 : hour;
            angle = (displayHour * 30 - 90) * (Math.PI / 180); // 30 degrees per hour
        } else {
            // Inner ring: 13-23 positions
            radius = 85;
            const adjustedHour = hour - 12; // Convert 13-23 to 1-11 positions
            angle = (adjustedHour * 30 - 90) * (Math.PI / 180);
        }
        
        const x = 140 + radius * Math.cos(angle); // 140 = half of 280px clock width
        const y = 140 + radius * Math.sin(angle);
        
        segment.style.left = (x - 12) + 'px'; // -12 to center the 24px wide segment
        segment.style.top = (y - 12) + 'px';  // -12 to center the 24px tall segment
    }
    
    /**
     * Calculate absolute hour distance (supports cross-period)
     */
    calculateAbsoluteHourDistance(hour, currentHour) {
        // Simple distance calculation: negative = past, 0 = current, positive = future
        return hour - currentHour;
    }
    
    /**
     * Determine if an hour is in the future (only future hours are non-interactive)
     */
    isHourInFuture(hour, currentHour, isAfternoon, isOuterRing, isInnerRing, isMidnight) {
        // Calculate absolute hour distance from current time
        const absoluteDistance = this.calculateAbsoluteHourDistance(hour, currentHour);
        
        // Only truly future hours (positive distance) are non-interactive
        return absoluteDistance > 0;
    }
    
    /**
     * Calculate opacity for comet trailing effect (supports cross-period trails)
     */
    calculateCometOpacity(hour, currentHour, isAfternoon, isOuterRing, isInnerRing, isMidnight) {
        // Calculate absolute distance from current hour (negative = past, positive = future)
        const absoluteDistance = this.calculateAbsoluteHourDistance(hour, currentHour);
        
        // Current hour gets maximum brightness
        if (absoluteDistance === 0) {
            return this.config.currentHourBrightness;
        }
        
        // Future hours get base brightness for their period
        if (absoluteDistance > 0) {
            const hourInCurrentPeriod = (isAfternoon && (isInnerRing)) || (!isAfternoon && (isOuterRing || isMidnight));
            return hourInCurrentPeriod ? this.config.baseBrightness : this.config.oppositePeriodBrightness;
        }
        
        // Past hours: calculate comet trail effect
        const distanceBack = Math.abs(absoluteDistance); // Convert to positive distance
        
        if (distanceBack <= this.config.cometTailLength) {
            // Hour is within the comet tail
            const falloffFactor = Math.pow(this.config.cometFalloffRate, distanceBack);
            const cometBoost = this.config.cometBrightnessBoost * falloffFactor;
            
            // Determine base brightness for this hour's period
            const hourInCurrentPeriod = (isAfternoon && (isInnerRing)) || (!isAfternoon && (isOuterRing || isMidnight));
            const baseBrightness = hourInCurrentPeriod ? this.config.baseBrightness : this.config.oppositePeriodBrightness;
            
            return Math.min(baseBrightness + cometBoost, this.config.currentHourBrightness);
        } else {
            // Hour is outside the comet tail - gets base brightness for its period
            const hourInCurrentPeriod = (isAfternoon && (isInnerRing)) || (!isAfternoon && (isOuterRing || isMidnight));
            return hourInCurrentPeriod ? this.config.baseBrightness : this.config.oppositePeriodBrightness;
        }
    }
    
    /**
     * Update current time display and active periods
     */
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toTimeString().substring(0, 5);
        const timeElement = document.getElementById(`${this.containerId}-time`);
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        // Update active periods if hour has changed
        const newHour = now.getHours();
        const newIsAfternoon = newHour >= 12;
        
        if (newHour !== this.currentHour) {
            this.currentHour = newHour;
            this.refreshClockFace(newHour, newIsAfternoon);
        }
    }
    
    /**
     * Refresh the clock face when the hour changes
     */
    refreshClockFace(newHour, newIsAfternoon) {
        // Remove all comet-trail, current, and interactivity classes
        document.querySelectorAll(`#${this.containerId}-face .hour-segment`).forEach(seg => {
            seg.classList.remove('comet-trail', 'current', 'interactive', 'future-hour');
            // Remove existing event listeners by cloning the element
            const newSeg = seg.cloneNode(true);
            seg.parentNode.replaceChild(newSeg, seg);
        });
        
        // Recalculate comet effect and interactivity for all segments
        document.querySelectorAll(`#${this.containerId}-face .hour-segment`).forEach(seg => {
            const segmentHour = parseInt(seg.dataset.hour);
            const isOuterSegment = seg.classList.contains('outer-ring');
            const isInnerSegment = seg.classList.contains('inner-ring');
            const isMidnightSegment = segmentHour === 0;
            
            // Apply new comet opacity
            const cometOpacity = this.calculateCometOpacity(segmentHour, newHour, newIsAfternoon, isOuterSegment, isInnerSegment, isMidnightSegment);
            seg.style.opacity = cometOpacity;
            
            // Add comet-trail class for hours in the trail (above base brightness)
            if (cometOpacity > this.config.baseBrightness) {
                seg.classList.add('comet-trail');
            }
            
            // Mark new current hour
            if (segmentHour === newHour) {
                seg.classList.add('current');
            }
            
            // Recalculate future hour status and add event listeners
            const isFutureHour = this.isHourInFuture(segmentHour, newHour, newIsAfternoon, isOuterSegment, isInnerSegment, isMidnightSegment);
            
            if (!this.config.disableFutureHours || !isFutureHour) {
                seg.addEventListener('mouseenter', () => this.showHourDetails(segmentHour));
                seg.addEventListener('mouseleave', () => {
                    if (this.pinnedHour !== segmentHour) this.hideHourDetails();
                });
                seg.addEventListener('click', () => this.handleHourClick(segmentHour));
                seg.classList.add('interactive');
                seg.style.cursor = 'pointer';
            } else {
                seg.classList.add('future-hour');
                seg.style.cursor = 'default';
                // Override opacity for future hours
                seg.style.opacity = this.config.futureHourBrightness;
            }
        });
    }
    
    /**
     * Show details for a specific hour
     */
    showHourDetails(hour) {
        const data = this.healthData[hour];
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const isPinned = this.pinnedHour === hour;
        const pinIcon = isPinned ? '📌' : '📍';
        const pinText = isPinned ? 'Unpin' : 'Pin';
        const pinClass = isPinned ? 'pinned' : '';
        
        this.detailsContainer.innerHTML = `
            <div class="hour-details">
                <div class="hour-header">
                    <div class="hour-title">
                        <span class="hour-time">${timeString}</span>
                        <span class="hour-status ${data.status}">${data.status}</span>
                    </div>
                    <button class="pin-toggle-btn ${pinClass}" onclick="togglePin(${hour})" title="${pinText} this hour">
                        <span class="pin-icon">${pinIcon}</span>
                    </button>
                </div>
                <div class="metrics-grid">
                    <div class="metric-detail">
                        <span class="metric-label">Response</span>
                        <span class="metric-value">${data.response}</span>
                    </div>
                    <div class="metric-detail">
                        <span class="metric-label">Memory</span>
                        <span class="metric-value">${data.memory}</span>
                    </div>
                    <div class="metric-detail">
                        <span class="metric-label">CPU</span>
                        <span class="metric-value">${data.cpu}</span>
                    </div>
                    <div class="metric-detail">
                        <span class="metric-label">Issues</span>
                        <span class="metric-value">${data.incidents}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Call callback if provided
        if (this.config.onHourHover) {
            this.config.onHourHover(hour, data);
        }
    }
    
    /**
     * Hide hour details (only if not pinned)
     */
    hideHourDetails() {
        if (this.pinnedHour === null) {
            this.detailsContainer.innerHTML = `
                <div class="detail-placeholder">
                    <span class="clock-icon">🕒</span>
                    <p>Hover over any hour to see details</p>
                </div>
            `;
        }
    }
    
    /**
     * Handle hour click events
     */
    handleHourClick(hour) {
        this.togglePin(hour);
        
        // Call callback if provided
        if (this.config.onHourClick) {
            this.config.onHourClick(hour, this.healthData[hour]);
        }
    }
    
    /**
     * Toggle pin state for an hour
     */
    togglePin(hour) {
        // Remove pinned visual class from all segments
        document.querySelectorAll(`#${this.containerId}-face .hour-segment`).forEach(seg => {
            seg.classList.remove('pinned-visual');
        });
        
        if (this.pinnedHour === hour) {
            // Unpin if clicking the same hour
            this.pinnedHour = null;
            this.hideHourDetails();
        } else {
            // Pin the new hour
            this.pinnedHour = hour;
            document.querySelector(`#${this.containerId}-face [data-hour="${hour}"]`).classList.add('pinned-visual');
            this.showHourDetails(hour); // Refresh the display with pinned state
        }
        
        // Call callback if provided
        if (this.config.onHourPin) {
            this.config.onHourPin(hour, this.pinnedHour !== null, this.healthData[hour]);
        }
    }
    
    /**
     * Start the update timer
     */
    startUpdateTimer() {
        this.updateTimer = setInterval(this.updateCurrentTime, this.config.updateInterval);
    }
    
    /**
     * Stop the update timer
     */
    stopUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    /**
     * Update the health data
     */
    updateHealthData(newHealthData) {
        this.healthData = newHealthData;
        // Refresh the clock face to reflect new data
        this.container.querySelector(`#${this.containerId}-face`).innerHTML = `
            <div class="clock-center">
                <div class="current-time" id="${this.containerId}-time">--:--</div>
                <div class="clock-dot"></div>
            </div>
        `;
        this.generateClockFace();
    }
    
    /**
     * Update configuration
     */
    updateConfig(newOptions) {
        // Update API config if provided
        if (newOptions.apiConfig) {
            Object.assign(this.config.apiConfig, newOptions.apiConfig);
        }
        
        // Update other config options
        Object.assign(this.config, newOptions);
        
        // Restart data refresh timer if interval changed
        if (newOptions.dataRefreshInterval !== undefined) {
            this.stopDataRefreshTimer();
            this.startDataRefreshTimer();
        }
        
        // Refresh the clock to apply new configuration
        this.refreshClockFace(this.currentHour, this.currentHour >= 12);
    }
    
    /**
     * Destroy the widget and clean up
     */
    destroy() {
        this.stopUpdateTimer();
        this.stopDataRefreshTimer();
        this.container.innerHTML = '';
        delete window.togglePin;
    }
    
    /**
     * Get default health data
     */
    getDefaultHealthData() {
        return [
            { hour: 0, status: 'healthy', response: '145ms', memory: '3.2GB', cpu: '15%', incidents: 0 },
            { hour: 1, status: 'healthy', response: '132ms', memory: '3.1GB', cpu: '12%', incidents: 0 },
            { hour: 2, status: 'healthy', response: '128ms', memory: '3.0GB', cpu: '10%', incidents: 0 },
            { hour: 3, status: 'healthy', response: '134ms', memory: '3.1GB', cpu: '11%', incidents: 0 },
            { hour: 4, status: 'healthy', response: '142ms', memory: '3.3GB', cpu: '14%', incidents: 0 },
            { hour: 5, status: 'healthy', response: '158ms', memory: '3.5GB', cpu: '18%', incidents: 0 },
            { hour: 6, status: 'healthy', response: '165ms', memory: '3.8GB', cpu: '22%', incidents: 0 },
            { hour: 7, status: 'degraded', response: '245ms', memory: '4.2GB', cpu: '35%', incidents: 0 },
            { hour: 8, status: 'degraded', response: '289ms', memory: '4.8GB', cpu: '45%', incidents: 1 },
            { hour: 9, status: 'degraded', response: '312ms', memory: '5.1GB', cpu: '52%', incidents: 1 },
            { hour: 10, status: 'healthy', response: '198ms', memory: '4.6GB', cpu: '38%', incidents: 0 },
            { hour: 11, status: 'healthy', response: '176ms', memory: '4.3GB', cpu: '32%', incidents: 0 },
            { hour: 12, status: 'healthy', response: '189ms', memory: '4.5GB', cpu: '36%', incidents: 0 },
            { hour: 13, status: 'degraded', response: '267ms', memory: '5.2GB', cpu: '48%', incidents: 1 },
            { hour: 14, status: 'degraded', response: '298ms', memory: '5.6GB', cpu: '55%', incidents: 2 },
            { hour: 15, status: 'unhealthy', response: 'TIMEOUT', memory: '6.1GB', cpu: '78%', incidents: 3 },
            { hour: 16, status: 'degraded', response: '345ms', memory: '5.8GB', cpu: '62%', incidents: 1 },
            { hour: 17, status: 'healthy', response: '234ms', memory: '5.1GB', cpu: '42%', incidents: 0 },
            { hour: 18, status: 'healthy', response: '198ms', memory: '4.7GB', cpu: '38%', incidents: 0 },
            { hour: 19, status: 'healthy', response: '167ms', memory: '4.2GB', cpu: '28%', incidents: 0 },
            { hour: 20, status: 'healthy', response: '154ms', memory: '3.9GB', cpu: '24%', incidents: 0 },
            { hour: 21, status: 'healthy', response: '148ms', memory: '3.6GB', cpu: '19%', incidents: 0 },
            { hour: 22, status: 'healthy', response: '141ms', memory: '3.4GB', cpu: '16%', incidents: 0 },
            { hour: 23, status: 'healthy', response: '138ms', memory: '3.2GB', cpu: '13%', incidents: 0 }
        ];
    }
}

// Export default for convenience
export default HealthClock;
