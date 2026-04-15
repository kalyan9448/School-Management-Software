# Parent Dashboard Notification System - Implementation Guide

## Overview

The Parent Dashboard now includes a **dynamic notification system** that fetches and displays real-time notifications from the School Admin for:
- 📊 **Exam Results** - Real-time exam scores and grades
- 📢 **School Announcements** - Important updates and school-wide notices
- 💳 **Fee Reminders** - Payment status, pending amounts, and due dates
- 📅 **Event Alerts** - Upcoming school events, holidays, and activities
- 📝 **Assignments** - New assignments and deadlines
- ✅ **Attendance** - Daily attendance status updates

## Components Created

### 1. **NotificationAggregator Service** (`src/services/notificationAggregator.ts`)
Centralized service for creating different types of notifications.

**Available Methods:**

```typescript
// Create exam result notification
notificationAggregator.createExamResultNotification({
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  class: string;
  section: string;
  parentId: string;
  schoolId: string;
})

// Create announcement notification
notificationAggregator.createAnnouncementNotification({
  announcementId: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'parent' | 'student' | 'teacher';
  targetClass?: string;
  targetSection?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  schoolId: string;
  parentId?: string;
})

// Create fee reminder notification
notificationAggregator.createFeeReminderNotification({
  studentId: string;
  studentName: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'partial';
  class: string;
  section: string;
  parentId: string;
  schoolId: string;
})

// Create event alert notification
notificationAggregator.createEventAlertNotification({
  eventId: string;
  eventName: string;
  description: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  schoolId: string;
  parentId?: string;
})

// Bulk create for entire class
notificationAggregator.createBulkNotification({
  parentIds: string[];
  schoolId: string;
  class: string;
  section: string;
  type: NotificationType;
  title: string;
  message: string;
})
```

### 2. **Hook: useAggregatedNotifications** (`src/hooks/useAggregatedNotifications.ts`)
React hook for managing notifications dynamically.

**Usage:**
```typescript
const { 
  allNotifications,        // All notifications for user
  categories,              // Notifications grouped by type
  stats,                   // Count per category
  unreadCount,            // Total unread notifications
  loading,                // Loading state
  error,                  // Error message if any
  refresh,                // Refresh notifications
  markAsRead,            // Mark single notification as read
  markAllAsRead,         // Mark all as read
  getCategoryStats,      // Get count for specific category
  getNotificationsByCategory,  // Filter by type
  getRecentNotifications,      // Latest N notifications
  getUnreadNotifications,      // Only unread ones
} = useAggregatedNotifications('parent');
```

### 3. **Component: ParentNotificationPanel** (`src/components/ParentNotificationPanel.tsx`)
Full-featured notification UI component with:
- ✅ **Real-time notification fetching** - Automatic refresh
- 🎯 **Category filtering** - Filter by notification type
- 🔍 **Search functionality** - Search notification titles/content
- 📊 **Unread badges** - Visual indicators for unread count
- 💫 **Compact/Expanded views** - Toggle between layouts
- ⚡ **Action buttons** - Mark as read, refresh, etc.
- 🎨 **Color-coded notifications** - Different colors per type

**Props:**
```typescript
interface ParentNotificationPanelProps {
  onClose?: () => void;           // Callback when closing
  className?: string;              // Additional CSS classes
  maxHeight?: string;              // Max height (e.g., 'max-h-[600px]')
  showHeader?: boolean;            // Show/hide header (default: true)
  compact?: boolean;               // Compact mode (default: false)
}
```

## Integration Points

### Dashboard Header
The notification bell icon shows unread count:
```typescript
<button onClick={() => setCurrentView('notifications')}>
  <Bell className="w-5 h-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full">
      {unreadCount}
    </span>
  )}
</button>
```

### Dedicated Notifications Page
Full page view with filtering and search:
```typescript
// When currentView === 'notifications'
<ParentNotificationPanel 
  onClose={() => setCurrentView('dashboard')}
  maxHeight="max-h-[calc(100vh-250px)]"
  showHeader={true}
/>
```

### Dashboard Widget
Compact widget showing recent notifications:
```typescript
<ParentNotificationPanel 
  maxHeight="max-h-[500px]"
  showHeader={true}
  compact={true}
/>
```

## How to Use - Backend Integration

### When Publishing Exam Results
```typescript
// In school admin dashboard or backend service
import { notificationAggregator } from './services/notificationAggregator';

// After saving exam result to Firestore
await notificationAggregator.createExamResultNotification({
  studentId: result.studentId,
  studentName: 'John Doe',
  examId: result.examId,
  examName: 'Mid-Term Exam',
  marks: 85,
  totalMarks: 100,
  percentage: 85,
  grade: 'A',
  class: '10',
  section: 'A',
  parentId: parentUser.uid,
  schoolId: activeSchoolId,
});
```

### Announcing School Events
```typescript
// Broadcast to multiple parents
await notificationAggregator.createEventAlertNotification({
  eventId: event.id,
  eventName: 'Annual Sports Day',
  description: 'All students participate in sports competitions',
  eventDate: '2025-04-20',
  eventTime: '09:00 AM',
  location: 'School Ground',
  schoolId: activeSchoolId,
  recipientRole: 'parent',
  // Leave parentId empty for broadcast, or specify for targeted
});
```

### Sending Fee Reminders
```typescript
// Can be triggered by cron job or manually
await notificationAggregator.createFeeReminderNotification({
  studentId: student.id,
  studentName: 'Jane Doe',
  invoiceId: invoice.id,
  amount: 5000,
  dueDate: '2025-04-15',
  status: 'overdue', // or 'pending', 'partial'
  class: '10',
  section: 'B',
  parentId: parent.uid,
  schoolId: activeSchoolId,
});
```

### Publishing School Announcements
```typescript
// Send to specific class or all parents
const parentIds = await getParentsOfClass('10', 'A');
await notificationAggregator.createBulkNotification({
  parentIds: parentIds,
  schoolId: activeSchoolId,
  class: '10',
  section: 'A',
  type: 'announcement',
  title: 'Class 10-A: Special Assembly Tomorrow',
  message: 'All students must attend special assembly on career guidance tomorrow at 9:00 AM',
  link: '/parent/dashboard/announcements/xyz',
});
```

## Database Schema

### Notifications Collection (`notifications`)
```typescript
interface Notification {
  id: string;                  // Auto-generated by Firestore
  school_id: string;          // School identifier
  userId: string;             // Target user ID
  recipientRole?: string;     // 'parent', 'student', 'teacher', etc.
  class?: string;             // Optional class filter
  section?: string;           // Optional section filter
  type: string;               // 'exam' | 'announcement' | 'fee' | 'event' | etc.
  title: string;              // Display title
  message: string;            // Display message
  date: string;               // ISO timestamp
  read: boolean;              // Read status
  readAt?: string;            // When marked as read
  link?: string;              // Deep link to resource
  sentVia?: string;           // 'in_app' | 'email' | 'sms'
  status?: string;            // 'sent' | 'delivered' | 'failed'
  created_at?: string;        // Creation timestamp
  updated_at?: string;        // Last updated timestamp
}
```

## Features & Capabilities

### 1. Real-time Updates
- Notifications fetch automatically on mount
- Manual refresh available
- Firestore real-time listeners can be added

### 2. Categorization
Notifications are automatically grouped by type:
- 📊 Exam Results
- 📢 Announcements
- 💳 Fee Reminders
- 📅 Events
- 📝 Assignments
- ✅ Attendance
- 📌 General

### 3. Filtering
- Filter by category
- Search by title/content
- View unread only
- View recent only

### 4. User Experience
- Visual indicators (unread badges, color-coded icons)
- Time display ("2 hours ago", "Today", etc.)
- Empty state messaging
- Loading and error states

### 5. Notification Actions
- Mark individual as read
- Mark all as read
- Refresh notification list
- Toggle between compact/expanded view

## Example Workflows

### Exam Results Publication Flow
1. **Admin publishes exam results** → School Admin Dashboard
2. **System creates notifications** → `notificationAggregator.createExamResultNotification()`
3. **Parent receives notification** → Bell icon shows unread count
4. **Parent clicks bell** → Views full notification with filtering
5. **Parent marks as read** → Notification status updated in Firestore

### Fee Reminder Flow
1. **Automatic job triggers** → Cron job checks for overdue invoices
2. **System sends reminders** → `createFeeReminderNotification()` for each parent
3. **Multiple reminders group** → Parents see "💳 Fee Reminders" category badge
4. **Parent views fees** → Clicks category to see all fee-related notifications
5. **Action taken** → Parent can navigate to fee details via notification link

## Configuration Options

### Notification Types (Extendable)
The system supports these types out-of-the-box:
- `exam` - Exam results and scores
- `announcement` - School announcements
- `fee` - Fee payments and reminders
- `event` - School events and activities
- `assignment` - New assignments and submissions
- `attendance` - Attendance records
- `general` - General notifications

To add new types, extend the `Notification` interface in `src/types/index.ts`:
```typescript
type: 'exam' | 'announcement' | 'fee' | 'event' | 'assignment' | 'attendance' | 'general' | 'your-new-type';
```

### Customization

**Change notification icons/colors:**
Edit `ParentNotificationPanel.tsx`:
```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'your-type': return <YourIcon className="w-5 h-5" />;
    // ...
  }
};

const getNotificationBgColor = (type: string) => {
  switch (type) {
    case 'your-type': return 'bg-color-100 border-color-200 hover:bg-color-100';
    // ...
  }
};
```

## Best Practices

### 1. When to Create Notifications
✅ **DO create notifications for:**
- Exam results published
- Fee payment due/overdue
- Important school announcements
- Upcoming events/holidays
- Assignment deadlines approaching
- Absence alerts

❌ **DON'T create notifications for:**
- Every minor update (use dashboard instead)
- Duplicate notifications (deduplicate first)
- Historical data already shown

### 2. Notification Content
- **Titles**: Keep to 50 characters max
- **Messages**: Keep to 200 characters max
- **Action-oriented**: "Fee overdue: Action required"
- **Include metrics**: "Exam: 85/100 (Grade A)"

### 3. Targeting
- Always provide `schoolId` for multi-tenant safety
- Use `recipientRole: 'parent'` for parent notifications
- Specify `class` and `section` for targeted notifications
- Use `parentId: 'all'` for broadcast with role filter

## Troubleshooting

### Notifications Not Appearing
1. Check `school_id` is set correctly
2. Verify `userId` exists in Firestore
3. Check browser console for errors
4. Ensure `recipientRole` matches user's role

### Slow Notification Loading
1. Use pagination for large notification sets
2. Consider archiving old notifications (> 30 days)
3. Add Firestore indexes for common queries:
   - `notifications: userId, date (DESC)`
   - `notifications: userId, read, date (DESC)`

### Notifications Not Updating
1. Call `refresh()` hook method manually
2. Set up real-time listeners with `onSnapshot()` (optional enhancement)
3. Check network tab for failed requests

## Future Enhancements

- [ ] **Real-time listeners** - Use Firestore onSnapshot for live updates
- [ ] **Email notifications** - Send digest emails for important notifications
- [ ] **SMS alerts** - For urgent notifications (fees, attendance)
- [ ] **Notification preferences** - Let parents choose what to receive
- [ ] **Do Not Disturb** - Silent mode during specific hours
- [ ] **Archive/Delete** - Bulk actions on old notifications
- [ ] **Notification badges** - Per-child notification summaries

## Files Modified/Created

### New Files:
- `src/services/notificationAggregator.ts` - Aggregator service
- `src/hooks/useAggregatedNotifications.ts` - React hook
- `src/components/ParentNotificationPanel.tsx` - UI component

### Modified Files:
- `src/components/ParentDashboardNew.tsx` - Integrated panel and hook
- `src/types/index.ts` - Already has Notification interface

### No Changes Required:
- `src/utils/firestoreService.ts` - Already has notification CRUD
- `src/hooks/useFirestoreData.ts` - Already has useNotifications hook

## Testing

### Manual Testing Checklist
- [ ] Bell icon shows unread count
- [ ] Click bell → full notification view displays
- [ ] Filter by category works
- [ ] Search filters notifications
- [ ] Mark as read updates UI
- [ ] Time formatting shows correctly
- [ ] No notifications shows empty state
- [ ] Loading state displays
- [ ] Error handling works

### Test Notifications (For Development)
```typescript
// Quick test in browser console
import { notificationAggregator } from './services/notificationAggregator';

await notificationAggregator.createExamResultNotification({
  studentId: 'test-student-1',
  studentName: 'Test Student',
  examId: 'test-exam-1',
  examName: 'Test Exam',
  marks: 90,
  totalMarks: 100,
  percentage: 90,
  grade: 'A',
  class: '10',
  section: 'A',
  parentId: 'your-user-id',
  schoolId: 'your-school-id',
});
```

## Support & Questions

For issues or feature requests related to the notification system:
1. Check the Firestore notifications collection
2. Verify user roles and permissions
3. Check browser console for JavaScript errors
4. Review Firestore security rules
