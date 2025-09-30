# AdvisorOS FAQ & Troubleshooting Guide

## Table of Contents

1. [Frequently Asked Questions](#frequently-asked-questions)
2. [Getting Started Issues](#getting-started-issues)
3. [Login & Authentication Problems](#login--authentication-problems)
4. [Client Management Issues](#client-management-issues)
5. [Document Upload & Processing](#document-upload--processing)
6. [QuickBooks Integration Problems](#quickbooks-integration-problems)
7. [Billing & Subscription Issues](#billing--subscription-issues)
8. [Performance & Loading Issues](#performance--loading-issues)
9. [Mobile App Troubleshooting](#mobile-app-troubleshooting)
10. [Error Messages & Solutions](#error-messages--solutions)
11. [Browser Compatibility](#browser-compatibility)
12. [Network & Connectivity Issues](#network--connectivity-issues)
13. [Data Import/Export Problems](#data-importexport-problems)
14. [API Integration Issues](#api-integration-issues)
15. [Contact Support](#contact-support)

---

## Frequently Asked Questions

### General Questions

**Q: What is AdvisorOS?**
A: AdvisorOS is a comprehensive cloud-based platform designed specifically for CPA firms to manage clients, process documents, integrate with QuickBooks, and provide financial advisory services. It includes features like OCR document processing, automated workflows, and AI-powered insights.

**Q: Is my data secure in AdvisorOS?**
A: Yes, AdvisorOS uses enterprise-grade security including:
- 256-bit SSL encryption for data in transit
- AES-256 encryption for data at rest
- Multi-factor authentication
- SOC 2 Type II compliance
- Regular security audits and penetration testing

**Q: Can I try AdvisorOS before purchasing?**
A: Yes, we offer a 30-day free trial with access to most features. You can sign up at [advisoros.com/trial](https://advisoros.com/trial) with no credit card required.

**Q: What subscription plans are available?**
A: We offer four plans:
- **Trial**: 30-day free trial (2 users, 10 clients, 1GB storage)
- **Starter**: $29/month (5 users, 50 clients, 10GB storage)
- **Professional**: $99/month (25 users, 250 clients, 100GB storage)
- **Enterprise**: Custom pricing (unlimited users and clients, 1TB+ storage)

**Q: Can I import data from my existing system?**
A: Yes, AdvisorOS supports data import from:
- Excel/CSV files for client and contact information
- QuickBooks data through direct integration
- Most common accounting software through standard export formats
- Custom data import assistance available for Enterprise customers

### Technical Questions

**Q: What browsers are supported?**
A: AdvisorOS works best with:
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Q: Is there a mobile app?**
A: Yes, AdvisorOS has mobile apps for iOS and Android with features including:
- Client profile access
- Document scanning and upload
- Task management
- Real-time notifications

**Q: Can I access AdvisorOS offline?**
A: The web application requires an internet connection, but the mobile app has limited offline functionality for viewing cached documents and creating notes that sync when reconnected.

**Q: What file types can I upload?**
A: Supported file types include:
- PDFs (recommended for text extraction)
- Images: JPG, PNG, TIFF, BMP
- Documents: DOC, DOCX, XLS, XLSX
- Text files: TXT, RTF
- Maximum file size: 50MB per file

---

## Getting Started Issues

### Account Setup Problems

**Issue: "Subdomain not available" error during signup**
**Solution:**
1. Choose a different subdomain - it must be unique across all AdvisorOS customers
2. Try variations like adding your city, state, or "cpa" to your firm name
3. Contact support if you believe the subdomain should be available

**Issue: Email verification not received**
**Solution:**
1. Check your spam/junk folder
2. Add noreply@advisoros.com to your safe sender list
3. Wait 10-15 minutes for delivery
4. Request a new verification email from the login page
5. Contact support if still not received after 30 minutes

**Issue: Can't complete organization setup**
**Solution:**
1. Ensure all required fields are completed
2. Use a valid business address format
3. Tax ID should be in format XX-XXXXXXX for US businesses
4. Clear browser cache and try again
5. Try using an incognito/private browser window

### First Login Issues

**Issue: "Organization not found" error**
**Solution:**
1. Verify you're using the correct subdomain URL (yourfirm.advisoros.com)
2. Check for typos in the organization subdomain
3. Ensure the organization setup was completed successfully
4. Contact support with your email address for assistance

**Issue: Setup wizard keeps restarting**
**Solution:**
1. Complete all steps without navigating away
2. Disable browser extensions that might interfere
3. Clear browser cookies and cache
4. Use a different browser
5. Contact support if the issue persists

### Team Member Invitation Problems

**Issue: Team member invitation email not received**
**Solution:**
1. Check if the email address is correct
2. Ask the invitee to check spam/junk folder
3. Resend the invitation from Settings > Team Management
4. Use a different email address if available
5. Contact support for bulk invitation assistance

**Issue: "Invalid invitation link" error**
**Solution:**
1. Ensure the link hasn't expired (invitations expire after 7 days)
2. Request a new invitation from the administrator
3. Copy and paste the entire URL carefully
4. Try opening the link in an incognito/private window
5. Clear browser cache and cookies

---

## Login & Authentication Problems

### Password and Access Issues

**Issue: Forgot password**
**Solution:**
1. Click "Forgot Password" on the login page
2. Enter your email address
3. Check email for reset instructions (including spam folder)
4. Follow the link and create a new password
5. Password must meet complexity requirements:
   - At least 8 characters
   - Include uppercase and lowercase letters
   - Include at least one number
   - Include at least one special character

**Issue: "Account locked" message**
**Solution:**
1. Wait 30 minutes for automatic unlock
2. Ensure you're using the correct password
3. Check Caps Lock is not enabled
4. Contact your organization administrator
5. If you're the administrator, contact AdvisorOS support

**Issue: Two-factor authentication not working**
**Solution:**
1. Ensure your device clock is synchronized
2. Try generating a new code
3. If using SMS, check your phone signal
4. For TOTP apps, try removing and re-adding the account
5. Use backup codes if available
6. Contact support to disable 2FA temporarily

### Single Sign-On (SSO) Issues

**Issue: SSO login fails**
**Solution:**
1. Verify SSO is configured correctly in your organization settings
2. Check with your IT administrator about SSO service status
3. Clear browser cookies for both AdvisorOS and your SSO provider
4. Try using an incognito/private browser window
5. Contact support with the specific error message

**Issue: "User not found" after SSO login**
**Solution:**
1. Ensure your email in the SSO system matches your AdvisorOS account
2. Contact your organization administrator to verify your account status
3. Check if auto-provisioning is enabled for new users
4. Verify you're accessing the correct organization subdomain

---

## Client Management Issues

### Adding and Editing Clients

**Issue: Can't save new client information**
**Solution:**
1. Ensure all required fields are completed:
   - Business Name
   - Primary Contact Email
   - Business Type
2. Check email format is valid (user@domain.com)
3. Verify Tax ID format is correct for your jurisdiction
4. Try removing special characters from business name
5. Clear browser cache and try again

**Issue: Client information doesn't update**
**Solution:**
1. Wait a few seconds after making changes
2. Refresh the page to see if changes were saved
3. Check your internet connection
4. Verify you have permission to edit client information
5. Try editing one field at a time rather than multiple fields

**Issue: Can't delete a client**
**Solution:**
1. Verify you have the required permissions (Owner or Admin role)
2. Check if the client has associated documents or transactions
3. Archive the client instead of deleting if data retention is required
4. Contact support if you need to permanently delete client data

### Client Data Import

**Issue: CSV import fails**
**Solution:**
1. Ensure CSV file follows the required format:
   - First row must contain column headers
   - Required columns: Business Name, Primary Contact Email
   - Use UTF-8 encoding
2. Check for special characters in data that might cause parsing errors
3. Verify file size is under 10MB
4. Remove empty rows at the end of the file
5. Download the CSV template from the import page

**Issue: Some clients not imported**
**Solution:**
1. Check the import summary for error details
2. Common issues:
   - Duplicate email addresses
   - Invalid email formats
   - Missing required fields
   - Unsupported business types
3. Fix errors in the CSV and re-import
4. Import can be run multiple times safely

---

## Document Upload & Processing

### Upload Issues

**Issue: Document upload fails**
**Solution:**
1. Check file size is under 50MB
2. Verify file type is supported (PDF, JPG, PNG, DOC, etc.)
3. Ensure stable internet connection
4. Try uploading one file at a time
5. Clear browser cache and cookies
6. Try using a different browser
7. Check available storage space in your plan

**Issue: "File type not supported" error**
**Solution:**
1. Convert file to a supported format:
   - Use PDF for text documents
   - Use JPG or PNG for images
   - Use DOC/DOCX for Word documents
2. Ensure file extension matches file content
3. Rename file to remove special characters
4. Contact support if you need support for additional file types

**Issue: Multiple file upload problems**
**Solution:**
1. Try uploading fewer files at once (max 10 files)
2. Ensure total upload size doesn't exceed 100MB
3. Check each file individually for corruption
4. Use the drag-and-drop interface instead of browse button
5. Wait for each batch to complete before starting the next

### OCR Processing Issues

**Issue: OCR processing stuck on "pending"**
**Solution:**
1. Wait up to 10 minutes for processing to complete
2. Refresh the page to check status
3. Check if the document contains readable text
4. Try re-uploading if stuck for more than 30 minutes
5. Contact support with the document ID

**Issue: Poor OCR accuracy**
**Solution:**
1. Ensure document is high quality and not blurry
2. Try scanning at higher resolution (300 DPI minimum)
3. Ensure document is right-side up
4. Remove backgrounds or shadows from photos
5. PDF documents typically have better OCR results than images
6. Manually review and correct extracted data

**Issue: OCR processing failed**
**Solution:**
1. Check if document is password protected
2. Verify document isn't corrupted
3. Try converting to PDF format
4. Ensure document contains actual text (not just images)
5. Contact support with the error message and document details

### Document Organization

**Issue: Can't find uploaded documents**
**Solution:**
1. Use the search function to look for filename or content
2. Check the correct client folder
3. Verify document category and filters
4. Check if document was uploaded to the correct organization
5. Use the global search in the top navigation

**Issue: Document categories not working**
**Solution:**
1. Ensure category is selected during upload
2. Try editing the document to change category
3. Check if your organization has custom categories configured
4. Use tags as alternative organization method
5. Contact administrator if categories need to be customized

---

## QuickBooks Integration Problems

### Initial Connection Issues

**Issue: QuickBooks connection fails**
**Solution:**
1. Ensure you're using QuickBooks Online (Desktop version not supported)
2. Verify you have Admin access to the QuickBooks company
3. Clear browser cache and cookies
4. Try connecting from an incognito/private browser window
5. Disable browser pop-up blockers
6. Contact support if you see specific error codes

**Issue: "Company not found" during connection**
**Solution:**
1. Verify you selected the correct company from the QuickBooks list
2. Ensure the company file is accessible and not in read-only mode
3. Check that your QuickBooks subscription is active
4. Try disconnecting and reconnecting
5. Contact QuickBooks support if company access issues persist

**Issue: Connection authorized but data not syncing**
**Solution:**
1. Wait up to 30 minutes for initial sync to complete
2. Check sync status in Settings > Integrations > QuickBooks
3. Verify sync settings are configured correctly
4. Check for QuickBooks API service outages
5. Try triggering a manual sync
6. Contact support with your QuickBooks Company ID

### Data Synchronization Issues

**Issue: Some data missing after sync**
**Solution:**
1. Check date range settings in sync configuration
2. Verify entities selected for sync (customers, accounts, transactions)
3. Check if data exists in QuickBooks within the specified date range
4. Review sync error logs for specific issues
5. Try a full resync instead of incremental

**Issue: Duplicate data appearing**
**Solution:**
1. This usually occurs with partial syncs - wait for completion
2. Check if data was modified in both systems simultaneously
3. Review sync conflict resolution settings
4. Contact support to clean up duplicates safely
5. Avoid making changes in both systems during sync

**Issue: Sync taking too long**
**Solution:**
1. Large data sets can take several hours for initial sync
2. Subsequent syncs should be much faster (incremental)
3. Check sync progress in the QuickBooks integration panel
4. Ensure stable internet connection
5. Contact support if sync runs longer than 24 hours

### Data Accuracy Issues

**Issue: Financial data doesn't match QuickBooks**
**Solution:**
1. Check the last sync timestamp to ensure data is current
2. Verify you're comparing the same date ranges
3. Check if any transactions were modified in QuickBooks after sync
4. Review sync error logs for failed transactions
5. Try a manual sync to update data
6. Contact support for data reconciliation assistance

**Issue: Client information doesn't match**
**Solution:**
1. Check if client was modified in AdvisorOS after QuickBooks sync
2. Verify customer is active in QuickBooks
3. Check field mapping configuration
4. Review any custom field mappings
5. Try updating client information in either system and resync

---

## Billing & Subscription Issues

### Payment Problems

**Issue: Payment failed**
**Solution:**
1. Verify credit card information is correct and current
2. Check card has sufficient available credit
3. Ensure billing address matches card registration
4. Try a different payment method
5. Contact your bank to ensure they're not blocking the transaction
6. Update payment method in Settings > Billing

**Issue: Invoice not received**
**Solution:**
1. Check spam/junk folder
2. Verify billing email address is correct in account settings
3. Add billing@advisoros.com to your safe sender list
4. Download invoice directly from Settings > Billing
5. Contact support to resend invoice

**Issue: Subscription canceled unexpectedly**
**Solution:**
1. Check for failed payment attempts
2. Review any emails about payment issues
3. Verify payment method is still valid
4. Contact support immediately to reactivate service
5. Update payment information to prevent future issues

### Plan Changes and Upgrades

**Issue: Can't upgrade subscription plan**
**Solution:**
1. Ensure current payment method is valid
2. Clear browser cache and try again
3. Contact support if you need a custom enterprise plan
4. Check if there are any outstanding billing issues
5. Try upgrading from a different browser

**Issue: Upgrade features not available immediately**
**Solution:**
1. Features typically activate within 15 minutes
2. Log out and log back in to refresh permissions
3. Clear browser cache to ensure latest version loads
4. Check if any team members need permission updates
5. Contact support if features aren't available after 1 hour

**Issue: Downgrade restrictions**
**Solution:**
1. Check if you're exceeding limits of the target plan:
   - Number of users
   - Number of clients
   - Storage usage
2. Remove excess users or archive clients before downgrading
3. Contact support for assistance with plan transitions
4. Consider the Professional plan if Starter limits are too restrictive

---

## Performance & Loading Issues

### Slow Loading Times

**Issue: Application loads slowly**
**Solution:**
1. Check your internet connection speed
2. Clear browser cache and cookies
3. Disable browser extensions temporarily
4. Try using a different browser
5. Check for browser updates
6. Restart your router/modem
7. Contact support if issues persist across multiple browsers

**Issue: Document viewing is slow**
**Solution:**
1. Large files (>10MB) may load slowly
2. Consider compressing PDF files before upload
3. Check internet connection stability
4. Try viewing during off-peak hours
5. Use document thumbnail preview for quick identification

**Issue: Search results load slowly**
**Solution:**
1. Be more specific with search terms
2. Use filters to narrow results
3. Clear browser cache
4. Try searching within specific clients or date ranges
5. Contact support if search consistently times out

### Browser Performance

**Issue: Browser crashes or freezes**
**Solution:**
1. Close other browser tabs and applications
2. Restart the browser
3. Clear browser cache and cookies
4. Disable browser extensions
5. Update browser to latest version
6. Try using Chrome or Firefox for best performance
7. Restart computer if issues persist

**Issue: High memory usage**
**Solution:**
1. AdvisorOS works best with at least 4GB RAM
2. Close unnecessary browser tabs
3. Restart browser periodically
4. Update browser to latest version
5. Consider upgrading computer memory if consistently problematic

---

## Mobile App Troubleshooting

### Installation and Setup

**Issue: Can't find mobile app in app store**
**Solution:**
1. Search for "AdvisorOS" in App Store (iOS) or Google Play (Android)
2. Ensure your device meets minimum requirements:
   - iOS 12.0+ or Android 8.0+
3. Check if app is available in your region
4. Contact support if app doesn't appear in search results

**Issue: Login fails on mobile app**
**Solution:**
1. Ensure you're using correct email and password
2. Check internet connection (Wi-Fi or cellular)
3. Update app to latest version
4. Try logging in through mobile browser first
5. Clear app cache (Android) or reinstall app (iOS)
6. Disable VPN if enabled

### Document Scanning Issues

**Issue: Document scan quality is poor**
**Solution:**
1. Ensure good lighting when scanning
2. Hold device steady and parallel to document
3. Use the document outline guide in the app
4. Clean camera lens
5. Scan documents flat without wrinkles or shadows
6. Retake scan if quality is insufficient

**Issue: Can't upload scanned documents**
**Solution:**
1. Check internet connection
2. Ensure sufficient storage space on device
3. Try uploading one document at a time
4. Check if you have permission to upload to the selected client
5. Force close and restart the app
6. Contact support if uploads consistently fail

### Sync and Performance

**Issue: Mobile app data not syncing**
**Solution:**
1. Ensure internet connection is stable
2. Force close and restart the app
3. Check app permissions for data and storage
4. Log out and log back in
5. Update app to latest version
6. Reinstall app if sync issues persist

**Issue: App crashes frequently**
**Solution:**
1. Update app to latest version
2. Restart your device
3. Free up device storage space
4. Close other apps running in background
5. Reinstall the app
6. Contact support with device model and iOS/Android version

---

## Error Messages & Solutions

### Common Error Messages

**Error: "Session expired. Please log in again."**
**Solution:**
1. Click "Log In" and enter credentials
2. This is normal after 8 hours of inactivity
3. Enable "Remember Me" to extend session
4. Check if system time on your device is correct

**Error: "Permission denied"**
**Solution:**
1. Contact your organization administrator
2. Verify you have the correct role for the action
3. Check if you're trying to access another organization's data
4. Log out and log back in to refresh permissions

**Error: "File too large"**
**Solution:**
1. Compress file to under 50MB
2. For PDFs, use online compression tools
3. For images, reduce resolution or convert to JPEG
4. Split large files into smaller sections
5. Contact support if you need to upload larger files

**Error: "Invalid file format"**
**Solution:**
1. Convert file to supported format (PDF, DOC, JPG, PNG)
2. Check file isn't corrupted
3. Rename file to remove special characters
4. Ensure file extension matches content type

**Error: "Network error - please try again"**
**Solution:**
1. Check internet connection
2. Try refreshing the page
3. Clear browser cache
4. Try using a different network
5. Contact support if error persists

### API and Integration Errors

**Error: "QuickBooks connection lost"**
**Solution:**
1. Go to Settings > Integrations > QuickBooks
2. Click "Reconnect" and authorize again
3. This typically happens every 6 months for security
4. Contact support if reconnection fails

**Error: "Sync failed - data conflict"**
**Solution:**
1. Check sync error logs for details
2. Common conflicts occur when data is modified in both systems
3. Choose which system's data to keep
4. Try manual sync after resolving conflicts

**Error: "Rate limit exceeded"**
**Solution:**
1. Wait 15 minutes before trying again
2. This protects against system overload
3. Reduce frequency of API calls if using custom integrations
4. Contact support for higher rate limits if needed

---

## Browser Compatibility

### Supported Browsers

**Recommended Browsers:**
- **Chrome 90+** (best performance)
- **Firefox 88+**
- **Safari 14+** (macOS only)
- **Edge 90+**

**Browser-Specific Issues:**

**Chrome:**
- Generally best compatibility
- Enable pop-ups for document viewing
- Check for ad blocker interference

**Firefox:**
- May have slower performance with large file uploads
- Ensure Enhanced Tracking Protection isn't blocking features
- Clear cache more frequently

**Safari:**
- Document uploads may be slower
- Enable third-party cookies in preferences
- Update to latest version for best compatibility

**Edge:**
- Similar performance to Chrome
- Ensure IE mode is disabled
- Clear cache if experiencing issues

### Browser Settings

**Required Settings:**
1. **Cookies**: Enable first-party and third-party cookies
2. **JavaScript**: Must be enabled
3. **Pop-ups**: Allow pop-ups for document viewing
4. **File Downloads**: Enable automatic downloads
5. **Local Storage**: Enable for session management

**Privacy Settings:**
1. Add *.advisoros.com to trusted sites
2. Allow cookies from advisoros.com
3. Disable strict tracking protection for AdvisorOS
4. Enable camera access for mobile web scanning

---

## Network & Connectivity Issues

### Connection Problems

**Issue: "Cannot connect to server"**
**Solution:**
1. Check internet connection
2. Try accessing other websites to verify connectivity
3. Flush DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
4. Try using a different DNS server (8.8.8.8, 1.1.1.1)
5. Contact your IT administrator if behind corporate firewall

**Issue: Intermittent connection drops**
**Solution:**
1. Check Wi-Fi signal strength
2. Try using ethernet connection
3. Restart router/modem
4. Contact your internet service provider
5. Try accessing AdvisorOS from different location

### Firewall and Security

**Corporate Firewall Issues:**
**Solution:**
1. Contact your IT administrator
2. Whitelist these domains:
   - *.advisoros.com
   - *.stripe.com (for billing)
   - *.quickbooks.com (for integration)
   - *.azure.com (for file storage)
3. Ensure HTTPS traffic is allowed on port 443
4. Allow WebSocket connections for real-time features

**VPN Compatibility:**
**Solution:**
1. AdvisorOS works with most VPN services
2. Try disconnecting VPN if experiencing issues
3. Contact VPN provider if specific compatibility issues
4. Use split tunneling to exclude AdvisorOS traffic

---

## Data Import/Export Problems

### Client Data Import

**Issue: CSV import shows formatting errors**
**Solution:**
1. Download the CSV template from the import page
2. Ensure required columns are present:
   - Business Name (required)
   - Primary Contact Email (required)
   - Business Type (required)
3. Check date formats are consistent (MM/DD/YYYY)
4. Remove any merged cells or formulas
5. Save as CSV (UTF-8) format

**Issue: Partial import success**
**Solution:**
1. Review import summary for error details
2. Common issues:
   - Duplicate email addresses
   - Invalid email formats
   - Missing required fields
   - Unsupported business types
3. Fix errors and re-import remaining records
4. Import is safe to run multiple times

### Document Export

**Issue: Export fails or times out**
**Solution:**
1. Try exporting smaller date ranges
2. Select fewer document types
3. Check internet connection stability
4. Try during off-peak hours
5. Contact support for large export assistance

**Issue: Exported files are corrupted**
**Solution:**
1. Try downloading export again
2. Use different browser
3. Check available disk space
4. Temporarily disable antivirus during download
5. Contact support if files consistently corrupt

### Financial Data Export

**Issue: QuickBooks data export incomplete**
**Solution:**
1. Ensure full sync is completed before export
2. Check date range matches available data
3. Verify all required entities are included in sync
4. Try exporting in smaller date ranges
5. Contact support for assistance with large datasets

---

## API Integration Issues

### Authentication Problems

**Issue: API key not working**
**Solution:**
1. Verify API key is correct (check for extra spaces)
2. Ensure API access is enabled for your plan
3. Check if key has expired or been revoked
4. Regenerate API key in Settings > API Access
5. Contact support for API access issues

**Issue: "Unauthorized" API responses**
**Solution:**
1. Include API key in Authorization header: `Bearer your-api-key`
2. Verify API key has required permissions
3. Check if endpoint requires specific user role
4. Ensure organization ID is correct in requests
5. Contact support with specific API endpoint and error

### Rate Limiting

**Issue: "Rate limit exceeded" errors**
**Solution:**
1. Implement exponential backoff in your application
2. Reduce request frequency
3. Use bulk endpoints where available
4. Cache responses to reduce API calls
5. Contact support for higher rate limits if needed

**Issue: API responses slow**
**Solution:**
1. Use pagination for large data sets
2. Implement response caching
3. Use specific field filters to reduce response size
4. Check network latency to AdvisorOS servers
5. Contact support for performance optimization assistance

### Data Synchronization

**Issue: API data doesn't match web interface**
**Solution:**
1. Check timestamps to ensure you're comparing current data
2. Verify same organization and user context
3. Check if data was filtered in API request
4. Use same date ranges in both comparisons
5. Clear cache and try again

---

## Contact Support

### Before Contacting Support

**Information to Gather:**
1. **Account Information:**
   - Organization name and subdomain
   - Your email address
   - User role (Owner, Admin, CPA, Staff)

2. **Technical Details:**
   - Browser and version
   - Operating system
   - Error messages (exact text or screenshots)
   - Steps to reproduce the issue

3. **Relevant Context:**
   - When did the issue start?
   - Does it happen consistently?
   - Have you tried any troubleshooting steps?
   - Does it affect other team members?

### Support Channels

**Help Documentation:**
- Online help: [https://docs.advisoros.com](https://docs.advisoros.com)
- Video tutorials: [https://tutorials.advisoros.com](https://tutorials.advisoros.com)
- Knowledge base: [https://help.advisoros.com](https://help.advisoros.com)

**Direct Support:**
- **Support Portal**: [https://support.advisoros.com](https://support.advisoros.com)
- **Email**: support@advisoros.com
- **Live Chat**: Available in-app during business hours (M-F, 8 AM - 6 PM EST)
- **Phone**: 1-800-ADVISOR (Enterprise customers only)

**Emergency Support:**
- **Critical Issues**: Use "Urgent" priority in support portal
- **Security Issues**: security@advisoros.com
- **Billing Issues**: billing@advisoros.com

### Support Response Times

**By Plan:**
- **Trial**: 72 hours (email only)
- **Starter**: 48 hours (email)
- **Professional**: 24 hours (email + chat)
- **Enterprise**: 4 hours (all channels + phone)

**By Priority:**
- **Low**: General questions, feature requests
- **Medium**: Non-critical functionality issues
- **High**: Significant functionality impacted
- **Critical**: System down, data loss, security issues

### What to Include in Support Requests

**For Technical Issues:**
1. Detailed description of the problem
2. Steps to reproduce the issue
3. Expected vs. actual behavior
4. Screenshots or screen recordings
5. Browser console errors (if available)
6. Network connection details

**For Data Issues:**
1. Specific client or document IDs affected
2. Date ranges when issue occurred
3. What data appears incorrect
4. Source system information (for integrations)
5. Any recent changes made to configuration

**For Performance Issues:**
1. Specific actions that are slow
2. Time of day when slowness occurs
3. Browser performance metrics
4. Network speed test results
5. Other applications' performance for comparison

### Escalation Process

**If Initial Support Doesn't Resolve Issue:**
1. Request escalation to Level 2 support
2. Ask for case manager assignment
3. Request phone call for complex issues
4. Escalate to product management for feature issues
5. Contact customer success for account-related concerns

### Training and Resources

**Available Training:**
- **Onboarding Sessions**: Complimentary setup assistance
- **Group Training**: Team training sessions
- **Webinar Series**: Monthly feature training
- **Custom Training**: Tailored training for Enterprise customers
- **Certification Program**: AdvisorOS expert certification

**Self-Service Resources:**
- **Video Library**: Step-by-step tutorials
- **User Community**: Forum for user discussions
- **Release Notes**: Latest feature updates
- **Best Practices**: Optimization guides
- **Integration Guides**: Third-party service setup

---

## Quick Reference

### Emergency Contacts
- **System Down**: support@advisoros.com (Subject: URGENT)
- **Security Incident**: security@advisoros.com
- **Billing Emergency**: billing@advisoros.com
- **Data Loss**: support@advisoros.com (Subject: DATA LOSS)

### Common Solutions
- **Clear browser cache**: Ctrl+F5 (PC) or Cmd+Shift+R (Mac)
- **Incognito mode**: Ctrl+Shift+N (PC) or Cmd+Shift+N (Mac)
- **Force refresh**: F5 or Ctrl+R
- **Check browser console**: F12 > Console tab

### Useful URLs
- **Status Page**: [https://status.advisoros.com](https://status.advisoros.com)
- **Documentation**: [https://docs.advisoros.com](https://docs.advisoros.com)
- **Community Forum**: [https://community.advisoros.com](https://community.advisoros.com)
- **Feature Requests**: [https://feedback.advisoros.com](https://feedback.advisoros.com)

---

*This troubleshooting guide is updated regularly. For the most current information, visit [https://docs.advisoros.com/troubleshooting](https://docs.advisoros.com/troubleshooting)*