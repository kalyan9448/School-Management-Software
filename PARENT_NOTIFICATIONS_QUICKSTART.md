# Parent Dashboard Notifications - Quick Start

## 🎯 What's New

Your Parent Portal now has a **dynamic, real-time notification system** that displays:
- 📊 **Exam Results** - Instant updates when exam scores are published
- 📢 **School Announcements** - Important school-wide messages
- 💳 **Fee Reminders** - Payment status and due dates
- 📅 **Event Alerts** - Upcoming school events and holidays
- 📝 **Assignments** - New assignments and deadlines
- ✅ **Attendance** - Daily attendance status updates

---

## 📦 Files You Need to Know

### 1. **Core Notification Service**
**File:** `src/services/notificationAggregator.ts`
- Handles creating all types of notifications
- Smart formatting with emojis and relevant data
- Bulk notification support

### 2. **React Hook**
**File:** `src/hooks/useAggregatedNotifications.ts`
- Manages notification state
- Fetches from Firestore
- Provides filtering, searching, sorting

### 3. **UI Component**
**File:** `src/components/ParentNotificationPanel.tsx`
- Beautiful notification display
- Search & category filter
- Mark as read / Refresh actions
- Two view modes: compact & expanded

### 4. **Usage Examples**
**File:** `src/services/notificationExamples.ts`
- Copy-paste ready code samples
- Integration points documented
- Helper functions included

---

## 🚀 Quick Start for Backend Developers

### Sending Exam Result Notifications

```typescript
import { notificationAggregator } from './services/notificationAggregator';

// When exam results are published by teacher/admin:
await notificationAggregator.createExamResultNotification({
  studentId: 'student-123',
  studentName: 'John Doe',
  examId: 'exam-abc',
  examName: 'Mid-Term Exam',
  marks: 85,
  totalMarks: 100,
  percentage: 85,
  grade: 'A',
  class: '10',
  section: 'A',
  parentId: 'parent-uid-xyz',        // Parent's Firebase UID
  schoolId: 'school-123',             // Your school ID
});
```

### Broadcasting Announcements

```typescript
// Send to entire class or school-wide:
await notificationAggregator.createBulkNotification({
  parentIds: ['parent-1-uid', 'parent-2-uid', ...],  // Array of parent UIDs
  schoolId: 'school-123',
  class: '10',
  section: 'A',
  type: 'announcement',
  title: '🔔 Important: Fee Due',
  message: 'Please pay pending fees by end of this week',
  link: '/parent/dashboard/fees',
});
```

### Fee Reminders

```typescript
// When invoice becomes overdue or payment is pending:
await notificationAggregator.createFeeReminderNotification({
  studentId: 'student-123',
  studentName: 'Jane Doe',
  invoiceId: 'invoice-456',
  amount: 5000,
  dueDate: '2025-04-20',
  status: 'overdue',  // or 'pending', 'partial'
  class: '10',
  section: 'B',
  parentId: 'parent-uid-xyz',
  schoolId: 'school-123',
});
```

### Event Alerts

```typescript
// Alert parents of upcoming events:
await notificationAggregator.createEventAlertNotification({
  eventId: 'event-789',
  eventName: 'Annual Sports Day',
  description: 'All students participate in sports competitions',
  eventDate: '2025-04-25',
  eventTime: '09:00 AM',
  location: 'School Ground',
  schoolId: 'school-123',
  parentId: 'parent-uid-xyz',  // Leave empty for broadcast
  daysAhead: 7,
});
```

### Attendance Notifications

```typescript
// Alert parents of absences or special attendance:
await notificationAggregator.createAttendanceNotification({
  studentId: 'student-123',
  studentName: 'John Doe',
  attendanceStatus: 'absent',  // 'present', 'absent', 'late', 'leave'
  date: '2025-04-15',
  class: '10',
  section: 'A',
  parentId: 'parent-uid-xyz',
  schoolId: 'school-123',
  reason: 'Medical appointment',
});
```

---

## 🎨 UI Integration

The Parent Dashboard automatically displays notifications in two places:

### 1. **Header Bell Icon**
- Shows unread notification count
- Click to open full notification view

### 2. **Dashboard Widget**
- Appears on main dashboard
- Shows recent notifications
- Click category to filter

### 3. **Dedicated Notifications Page**
- Full-screen notification view
- Advanced filtering and search
- All notification management features

---

## 📊 Database & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   School Admin Actions                       │
│  (Publish Exam, Create Announcement, Mark Attendance)        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│          notificationAggregator Service                       │
│  (Create exam/announcement/fee/event notifications)           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Firestore: notifications Collection                   │
│  (Stores notification documents)                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│      useAggregatedNotifications Hook                          │
│  (Fetches & categorizes notifications)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│      ParentNotificationPanel Component                        │
│  (Displays formatted notifications with filters)              │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Parent Sees Item  │
         │   on Dashboard     │
         └────────────────────┘
```

---

## 🔧 Integration Points (Where to Call These)

| Action | File | Function | Trigger |
|--------|------|----------|---------|
| Publish Exam Results | `src/pages/school-admin/ExamPage.tsx` | `createExamResultNotification()` | When admin publishes results |
| Create Announcement | `src/components/AnnouncementModule.tsx` | `createBulkNotification()` | When admin broadcasts |
| Mark Attendance | `src/components/AttendanceMarking.tsx` | `createAttendanceNotification()` | When teacher marks attendance |
| Check Fees Overdue | `backend/cron/fee-reminder.js` | `createFeeReminderNotification()` | Daily at 10 AM |
| Upcoming Events | `backend/cron/event-alerts.js` | `createEventAlertNotification()` | 7 days before event |
| New Assignment | `src/components/AssignmentModule.tsx` | `createAssignmentNotification()` | When teacher creates assignment |

---

## ✅ Checklist for Implementation

- [ ] Review `src/services/notificationAggregator.ts` - understand available methods
- [ ] Review `src/services/notificationExamples.ts` - copy relevant examples
- [ ] Identify where in your code to add notification calls
- [ ] Test by creating sample notification manually
- [ ] Set up cron jobs for fee reminders and event alerts
- [ ] Train school admins on using new notification system
- [ ] Monitor Firestore notifications collection for successful creation
- [ ] Test on Parent Dashboard to see notifications display

---

## 🐛 Troubleshooting

### Notifications not showing up?

1. **Check Firestore Console**
   - Navigate to Firestore → Collections → notifications
   - Look for documents with your parent's userId
   - Verify `school_id` matches

2. **Check Parent Dashboard**
   - Open browser console (F12)
   - Look for errors in Network or Console tab
   - Verify hook is being called

3. **Verify Data**
   - Ensure `userId` = parent's Firebase UID
   - Ensure `school_id` is set correctly
   - Check date format is valid ISO string

### Notifications displaying but not updating?

1. Click "Refresh" button in notification panel
2. Check hook is calling `notificationService.getByUser()`
3. Verify Firestore security rules allow read access

---

## 📝 Notes

- **Multi-tenant Safe**: Always provide `schoolId` to isolate data per school
- **Scalable**: Uses Firestore queries efficiently
- **Real-time Ready**: Can add real-time listeners later if needed
- **Type-safe**: Full TypeScript support throughout
- **Accessible**: Follows accessibility best practices

---

## 📚 Full Documentation

For detailed documentation, API reference, and advanced usage:
→ See `PARENT_NOTIFICATIONS_GUIDE.md` in project root

---

## 🎓 Example: Complete Workflow

### Scenario: Teacher publishes exam results

```typescript
// 1. Teacher clicks "Publish Results" in Exam Module
// 2. System creates exam results in Firestore
// 3. Code calls:

await notificationAggregator.createExamResultNotification({
  studentId: 'john-123',
  studentName: 'John Doe',
  examId: 'midterm-2025',
  examName: 'Mid-Term Exam',
  marks: 85,
  totalMarks: 100,
  percentage: 85,
  grade: 'A',
  class: '10',
  section: 'A',
  parentId: 'john-parent-uid',
  schoolId: 'school-xyz',
});

// 4. Notification created in Firestore
// 5. Parent's phone shows:
//    - Bell icon badge: "1"
// 6. Parent clicks bell and sees:
//    - "📊 Exam Results: Mid-Term Exam"
//    - "John scored 85/100 (85%) - Grade: 🟢 A"
//    - "Just now"
```

---

## 🚀 Ready to Deploy?

1. ✅ Code is production-ready
2. ✅ Error handling implemented
3. ✅ TypeScript compilation passes
4. ✅ Firestore integration tested
5. ✅ UI responsive and accessible

**Next Steps:**
- Integrate notification calls in your business logic
- Deploy to Firebase/production
- Train school admins
- Monitor for issues

---

## 📞 Support

Issues? Check:
1. `PARENT_NOTIFICATIONS_GUIDE.md` - Comprehensive reference
2. `src/services/notificationExamples.ts` - Working examples
3. Browser console - Error messages
4. Firestore console - Verify data creation
