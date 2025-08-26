#!/bin/bash

# Netflix Real Estate Training - Production Monitoring Setup
# This script sets up monitoring and analytics for your production deployment

set -e

echo "📊 Setting up production monitoring..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[MONITORING]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[SETUP REQUIRED]${NC} $1"
}

# Create monitoring configuration
print_status "Creating monitoring configuration..."

# Google Analytics Setup
cat > frontend/src/analytics.js << 'EOF'
// Google Analytics 4 Configuration
export const initAnalytics = () => {
  if (process.env.REACT_APP_GOOGLE_ANALYTICS_ID && process.env.NODE_ENV === 'production') {
    // Load Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', process.env.REACT_APP_GOOGLE_ANALYTICS_ID, {
      page_title: 'Netflix Real Estate Training',
      page_location: window.location.href
    });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (window.gtag && process.env.NODE_ENV === 'production') {
    window.gtag('event', eventName, {
      event_category: 'Real Estate Training',
      event_label: parameters.label || '',
      value: parameters.value || 0,
      ...parameters
    });
  }
};

// Track video interactions
export const trackVideoEvent = (action, videoTitle, progress = 0) => {
  trackEvent('video_interaction', {
    action: action, // 'play', 'pause', 'complete', 'progress'
    video_title: videoTitle,
    progress: progress,
    label: `${action}_${videoTitle}`
  });
};

// Track user login
export const trackUserLogin = (userRole) => {
  trackEvent('login', {
    method: 'email',
    user_role: userRole,
    label: `login_${userRole}`
  });
};

// Track admin actions
export const trackAdminAction = (action, details = '') => {
  trackEvent('admin_action', {
    action: action, // 'create_user', 'upload_video', 'edit_category'
    details: details,
    label: `admin_${action}`
  });
};
EOF

# Error Tracking Setup (Sentry)
cat > frontend/src/errorTracking.js << 'EOF'
// Error Tracking with Sentry (Optional)
export const initErrorTracking = () => {
  if (process.env.REACT_APP_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    // This would require Sentry SDK installation
    // npm install @sentry/react @sentry/tracing
    console.log('Error tracking would be initialized here with Sentry');
  }
};

// Custom error logging
export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to console in production for now
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Here you could send to external logging service
    // Example: LogRocket, Sentry, or custom endpoint
  }
};

// Performance monitoring
export const trackPerformance = () => {
  if ('performance' in window && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const metrics = {
          page_load_time: perfData.loadEventEnd - perfData.fetchStart,
          dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          first_byte: perfData.responseStart - perfData.fetchStart
        };
        
        console.log('Performance Metrics:', metrics);
        
        // Track performance in analytics
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            event_category: 'Performance',
            event_label: 'Initial Load',
            value: Math.round(metrics.page_load_time)
          });
        }
      }
    });
  }
};
EOF

print_success "Monitoring configuration files created!"

# Create uptime monitoring script
cat > uptime-monitor.js << 'EOF'
// Simple uptime monitoring script
// Run this on a separate server or service to monitor your app

const https = require('https');
const http = require('http');

const config = {
  url: 'https://your-domain.com', // Replace with your actual domain
  interval: 300000, // 5 minutes
  timeout: 10000, // 10 seconds
  expectedStatusCode: 200
};

function checkUptime() {
  const startTime = Date.now();
  const protocol = config.url.startsWith('https') ? https : http;
  
  const req = protocol.get(config.url, (res) => {
    const responseTime = Date.now() - startTime;
    const status = res.statusCode;
    
    console.log(`[${new Date().toISOString()}] Status: ${status}, Response Time: ${responseTime}ms`);
    
    if (status !== config.expectedStatusCode) {
      console.error(`❌ Website DOWN! Expected ${config.expectedStatusCode}, got ${status}`);
      // Here you could send alerts via email, Slack, etc.
    } else {
      console.log(`✅ Website UP - ${responseTime}ms`);
    }
  });
  
  req.setTimeout(config.timeout, () => {
    console.error(`❌ Website TIMEOUT! No response within ${config.timeout}ms`);
    req.abort();
  });
  
  req.on('error', (error) => {
    console.error(`❌ Website ERROR: ${error.message}`);
  });
}

// Start monitoring
console.log(`🔍 Starting uptime monitoring for ${config.url}`);
console.log(`📊 Checking every ${config.interval / 1000} seconds`);
checkUptime(); // Initial check
setInterval(checkUptime, config.interval);
EOF

print_success "Uptime monitoring script created!"

# Create backup script
cat > backup-system.js << 'EOF'
// Automated backup system for user data and configurations
// This runs in the browser to backup localStorage data

class BackupSystem {
  constructor() {
    this.backupKeys = [
      'netflixRealEstateCustomization',
      'netflixRealEstateUsers',
      'netflixRealEstateCategories',
      'netflixRealEstateBannerVideo',
      'netflixRealEstateTheme'
    ];
  }

  // Create a backup of all important data
  createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    };

    this.backupKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backup.data[key] = JSON.parse(data);
        } catch (e) {
          backup.data[key] = data;
        }
      }
    });

    return backup;
  }

  // Download backup as JSON file
  downloadBackup() {
    const backup = this.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `netflix-real-estate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Restore from backup file
  async restoreFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          this.restoreBackup(backup);
          resolve(backup);
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  // Restore backup data
  restoreBackup(backup) {
    if (!backup.data) {
      throw new Error('Invalid backup format');
    }

    Object.keys(backup.data).forEach(key => {
      if (this.backupKeys.includes(key)) {
        localStorage.setItem(key, JSON.stringify(backup.data[key]));
      }
    });

    // Reload page to apply changes
    window.location.reload();
  }

  // Auto-backup (called periodically)
  setupAutoBackup() {
    // Backup every 24 hours
    setInterval(() => {
      const backup = this.createBackup();
      // Store in IndexedDB for local backup
      this.storeLocalBackup(backup);
    }, 24 * 60 * 60 * 1000);
  }

  // Store backup in IndexedDB
  storeLocalBackup(backup) {
    if ('indexedDB' in window) {
      const request = indexedDB.open('NetflixRealEstateBackups', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        store.add({
          id: Date.now(),
          timestamp: backup.timestamp,
          data: backup
        });
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
      };
    }
  }
}

// Export for use in the app
window.BackupSystem = BackupSystem;
EOF

print_success "Backup system created!"

# Create security checklist
cat > security-checklist.md << 'EOF'
# 🔐 Production Security Checklist

## ✅ Essential Security Measures

### 1. HTTPS Configuration
- [ ] SSL certificate installed and valid
- [ ] HTTP to HTTPS redirect enabled
- [ ] HSTS header configured
- [ ] Certificate auto-renewal setup

### 2. Security Headers
- [ ] Content Security Policy (CSP) implemented
- [ ] X-Frame-Options set to DENY
- [ ] X-XSS-Protection enabled
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured

### 3. Authentication Security
- [ ] Strong password requirements enforced
- [ ] Rate limiting on login attempts
- [ ] Session management secure
- [ ] No sensitive data in localStorage (currently acceptable for demo)

### 4. Data Protection
- [ ] Input validation on all forms
- [ ] XSS protection implemented
- [ ] CSRF protection where needed
- [ ] Regular security updates scheduled

### 5. Infrastructure Security
- [ ] Server access restricted
- [ ] Regular security patches applied
- [ ] Monitoring and alerting setup
- [ ] Backup systems tested

## 🚨 Security Monitoring

### Log These Events:
- Failed login attempts
- Suspicious user behavior
- File upload attempts
- Admin panel access
- Error occurrences

### Regular Security Tasks:
- Weekly: Review access logs
- Monthly: Security scan and audit
- Quarterly: Penetration testing
- Annually: Full security review

## 📞 Incident Response Plan

1. **Detection**: Monitor alerts and logs
2. **Assessment**: Determine severity and impact
3. **Containment**: Limit damage and exposure
4. **Recovery**: Restore normal operations
5. **Review**: Analyze and improve security measures
EOF

print_success "Security checklist created!"

print_warning "Manual setup required for external services:"
echo ""
echo "1. 📊 Google Analytics:"
echo "   - Create account at https://analytics.google.com"
echo "   - Get tracking ID and add to .env.production"
echo ""
echo "2. 🚨 Error Tracking (Optional):"
echo "   - Sign up for Sentry at https://sentry.io"
echo "   - Install: npm install @sentry/react @sentry/tracing"
echo "   - Add DSN to .env.production"
echo ""
echo "3. 📈 Uptime Monitoring:"
echo "   - Use services like Pingdom, UptimeRobot, or StatusCake"
echo "   - Set up alerts for downtime"
echo ""
echo "4. 🔒 Security Monitoring:"
echo "   - Consider services like Cloudflare for DDoS protection"
echo "   - Set up SSL monitoring"

print_success "Production monitoring setup completed!"
echo ""
echo "📁 Files created:"
echo "   - frontend/src/analytics.js (Google Analytics integration)"
echo "   - frontend/src/errorTracking.js (Error monitoring)"
echo "   - uptime-monitor.js (Uptime monitoring script)"
echo "   - backup-system.js (Data backup system)"
echo "   - security-checklist.md (Security guidelines)"