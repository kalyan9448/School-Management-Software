# Parent Dashboard Notifications - Architecture & Architecture Diagrams

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     PARENT DASHBOARD USER INTERFACE                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Header: 🔔 Bell Icon (shows unread badge) - Opens full view        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Dashboard Main Content                                  │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │ Child Info Card                                               │  │  │
│  │  │ Today's Summary (Attendance, Lessons, Quizzes, Score)        │  │  │
│  │  │ AI Discussion Suggestions                                    │  │  │
│  │  │                                                               │  │  │
│  │  │ ╔═════════════════════════════════════════════════════════╗ │  │  │
│  │  │ ║ 🔔 NOTIFICATIONS WIDGET                               ║ │  │  │
│  │  │ ║ ┌─────────────────────────────────────────────────────┐ ║ │  │  │
│  │  │ ║ │ Search: [search box]    [Expand View] [Mark All]   │ ║ │  │  │
│  │  │ ║ │ Filter: [All] [📊 Exams] [📢 Announce] [💳 Fees]  │ ║ │  │  │
│  │  │ ║ ├─────────────────────────────────────────────────────┤ ║ │  │  │
│  │  │ ║ │ 📊 Exam Results: Mid-Term                          │ ║ │  │  │
│  │  │ ║ │    John scored 85/100 (Grade A)    ✓ Read         │ ║ │  │  │
│  │  │ ║ │    2 hours ago                                     │ ║ │  │  │
│  │  │ ║ ├─────────────────────────────────────────────────────┤ ║ │  │  │
│  │  │ ║ │ 💳 Fee Reminders (2 unread) ●                       │ ║ │  │  │
│  │  │ ║ │    Amount: ₹5000 | Overdue!        ⚫ Unread       │ ║ │  │  │
│  │  │ ║ │    1 day ago                                       │ ║ │  │  │
│  │  │ ║ ├─────────────────────────────────────────────────────┤ ║ │  │  │
│  │  │ ║ │ 📢 Announcements: Annual Day Celebration           │ ║ │  │  │
│  │  │ ║ │    April 25 | School Ground              ✓ Read   │ ║ │  │  │
│  │  │ ║ │    3 days ago                                      │ ║ │  │  │
│  │  │ ║ └─────────────────────────────────────────────────────┘ ║ │  │  │
│  │  │ ║ [Refresh]                          3 notifications      ║ │  │  │
│  │  │ ╚═════════════════════════════════════════════════════════╝ │  │  │
│  │  │                                                               │  │  │
│  │  │ What My Child Learned Today                                 │  │  │
│  │  │ Upcoming School Events                                      │  │  │
│  │  │ Quick Actions (Timeline, Progress, Fees, etc)              │  │  │
│  │  └───────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

OR when viewing full notifications page:

┌──────────────────────────────────────────────────────────────────────────┐
│                   FULL NOTIFICATIONS PAGE (maxHeight)                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Header: 🔔 Notifications (3 unread) [Bell Icon]                         │
│  Search: [🔍 search notifications...                                ]    │
│  ────────────────────────────────────────────────────────────────────    │
│  Filters: [All] [📊Exams:2] [📢Announce:1] [💳Fees:3] [📅Events:0]      │
│  Actions: [Expand View] [Mark All Read]                                  │
│  ────────────────────────────────────────────────────────────────────    │
│                                                                            │
│  📊 Exam Results (Category Header)                                        │
│  ├─ 📊 Mid-Term Exam: 85/100 (Grade A)           ● Unread - 2h ago      │
│  └─ 📊 Final Exam: 92/100 (Grade A+)             ✓ Read - 5 days ago    │
│                                                                            │
│  📢 Announcements (Category Header)                                       │
│  └─ 📢 Annual Day Celebration on April 25        ✓ Read - 3 days ago    │
│                                                                            │
│  💳 Fee Reminders (Category Header)                                       │
│  ├─ 💳 Fee Overdue: ₹5000                        ● Unread - Yesterday    │
│  ├─ 💳 Partial Payment Due: ₹2000                ● Unread - 2 days ago   │
│  └─ 💳 Fee Reminder: ₹10000 due April 20        ✓ Read - 1 week ago     │
│                                                                            │
│  [Refresh]                              Showing 6 notifications           │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION CREATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

SCHOOL ADMIN ACTIONS:
  ↓
  ├─ Publishes Exam Results ──────────┐
  ├─ Creates Announcement ────────────┤
  ├─ Marks Attendance ────────────────┤
  ├─ Creates New Assignment ──────────┤ 
  ├─ Publishes Event ─────────────────┤
  └─ Records Fee Payment ────────────┬┘

NOTIFICATION AGGREGATOR SERVICE:
  ↓
  notificationAggregator.create*Notification({
    - Student/Child info
    - Relevant data (marks, amount, date, etc)
    - Parent ID (recipient)
    - School ID (multi-tenant)
    - Message formatting
  })
  ↓

FIRESTORE DATABASE:
  ↓
  /notifications collection:
  - Document ID: auto-generated
  - userId: parent's Firebase UID
  - type: 'exam' | 'announcement' | 'fee' | 'event' | ...
  - title: formatted title
  - message: formatted content
  - date: ISO timestamp
  - read: boolean
  - school_id: tenant identifier

PARENT DASHBOARD - Real-time Flow:
  ↓
  useAggregatedNotifications() Hook:
    1. Fetches notifications from Firestore
    2. Filters by user ID + role + class
    3. Categorizes by type
    4. Calculates stats & unread count
    5. Returns organized data
  ↓

PARENT NOTIFICATION PANEL Component:
  ↓
  Displays:
    - Search bar (filters by title/content)
    - Category tabs (exam, fee, etc)
    - Unread badges
    - Time formatting
    - Color-coded icons
    - Action buttons
  ↓

PARENT SEES:
  ├─ Dashboard widget showing recent notifications
  ├─ Header bell icon with unread count
  └─ Full page notifications view with filters

PARENT ACTIONS:
  ├─ Click notification → opens full details
  ├─ Click category → filters that type
  ├─ Mark as read → updates Firestore
  ├─ Click "All Read" → bulk update
  └─ Search → local filter
```

---

## Component Hierarchy

```
ParentDashboardPage
  └─ ParentDashboardNew (main component)
      ├─ DashboardLayout (wraps everything)
      ├─ Header
      │  ├─ Logo
      │  ├─ User info
      │  └─ Bell Icon (shows unread count)
      │      └─ onClick: setCurrentView('notifications')
      │
      ├─ DashboardNav (sidebar navigation)
      │
      ├─ Main Content (based on currentView)
      │  ├─ If view === 'dashboard':
      │  │  ├─ Holiday Alert
      │  │  ├─ Child Info
      │  │  ├─ Today's Summary
      │  │  ├─ AI Suggestions
      │  │  ├─ 🆕 ParentNotificationPanel (widget mode)
      │  │  │  └─ compact={true}
      │  │  │  └─ maxHeight="max-h-[500px]"
      │  │  ├─ Today's Learning
      │  │  ├─ Events Card
      │  │  └─ Quick Actions
      │  │
      │  └─ If view === 'notifications':
      │     └─ 🆕 ParentNotificationPanel (full page mode)
      │        ├─ onClose={() => setCurrentView('dashboard')}
      │        ├─ maxHeight="max-h-[calc(100vh-250px)]"
      │        ├─ showHeader={true}
      │        └─ compact={false}
      │
      └─ WhatsApp Support Button

ParentNotificationPanel (Reusable Component)
  ├─ Header (if showHeader=true)
  │  ├─ 🔔 Title + Unread Badge
  │  └─ Search Bar
  ├─ Category Filter Bar
  │  ├─ [All] filter button
  │  └─ [Category] buttons with unread counts
  ├─ Action Bar
  │  ├─ View Toggle (Compact/Expanded)
  │  └─ Mark All Read button (if unread > 0)
  ├─ Notification List
  │  ├─ NotificationCard (for each)
  │  │  ├─ Icon (colored by type)
  │  │  ├─ Title
  │  │  ├─ Message
  │  │  ├─ Time ago
  │  │  └─ Read indicator dot
  │  └─ Empty State (if no notifications)
  └─ Footer
     ├─ Refresh button
     └─ Count display

useAggregatedNotifications() Hook
  └─ State:
     ├─ allNotifications[]
     ├─ categories[] (grouped)
     ├─ stats {} (counts)
     ├─ unreadCount: number
     ├─ loading: boolean
     ├─ error: string | null
     └─ Methods:
        ├─ refresh()
        ├─ markAsRead(id)
        ├─ markAllAsRead()
        ├─ getNotificationsByCategory(type)
        ├─ getRecentNotifications(limit)
        └─ getUnreadNotifications()
```

---

## Notification Types & Styling

```
┌─────────────────┬──────────────────┬──────────────┬────────────────────┐
│ Type            │ Icon             │ Color        │ Use Case            │
├─────────────────┼──────────────────┼──────────────┼────────────────────┤
│ exam            │ 📊 TrendingUp    │ Indigo       │ Exam results        │
│ announcement    │ 📢 Volume2       │ Teal         │ School messages     │
│ fee             │ 💳 DollarSign    │ Orange       │ Fee reminders       │
│ event           │ 📅 Calendar      │ Purple       │ School events       │
│ assignment      │ 📝 BookOpen      │ Blue         │ New assignments     │
│ attendance      │ ✅ CheckCircle   │ Green        │ Attendance alerts   │
│ general         │ 🔔 Bell          │ Gray         │ Other notifications │
└─────────────────┴──────────────────┴──────────────┴────────────────────┘

Color Scheme (Tailwind):
- Exam:         from-indigo-600 to-indigo-800 | bg-indigo-50
- Announcement: from-teal-600 to-teal-800     | bg-teal-50
- Fee:          from-orange-600 to-orange-800 | bg-orange-50
- Event:        from-purple-600 to-purple-800 | bg-purple-50
- Assignment:   from-blue-600 to-blue-800     | bg-blue-50
- Attendance:   from-green-600 to-green-800   | bg-green-50
- General:      from-gray-600 to-gray-800     | bg-gray-50

Read Status:
- Read:   bg-white border-gray-200 (low opacity)
- Unread: bg-{color}-50 border-{color}-300 (bright highlight)
           + Blue dot indicator (w-2 h-2)
```

---

## State Management Flow

```
useAggregatedNotifications Hook
│
├─ Initial Load:
│  ├─ Check if currentUser.uid exists
│  ├─ Call dataService.notification.getByUser(userId, role, class, section)
│  ├─ Sort by date DESC
│  └─ Store in allNotifications[]
│
├─ Categorization:
│  ├─ Group notifications by type
│  ├─ Count per category
│  ├─ Calculate unreadCount per category
│  └─ Build categories[] array
│
├─ Stats:
│  ├─ stats.exam = count
│  ├─ stats.announcement = count
│  ├─ ... for each type
│  └─ unreadCount = total unread
│
├─ User Actions:
│  ├─ markAsRead(id):
│  │  ├─ Call dataService.notification.markAsRead(id)
│  │  ├─ Update allNotifications[].read = true
│  │  └─ Decrement unreadCount
│  │
│  ├─ markAllAsRead():
│  │  ├─ Call dataService.notification.markAllAsRead(userId)
│  │  ├─ Update all read = true
│  │  └─ Set unreadCount = 0
│  │
│  └─ refresh():
│     └─ Re-run initial load flow
│
└─ Derived Data:
   ├─ getRecentNotifications(5) → sorted by date
   ├─ getUnreadNotifications() → filter by read=false
   ├─ getNotificationsByCategory('exam') → filter by type
   └─ getCategoryStats('exam') → count for type
```

---

## Database Query Patterns

```
FIRESTORE QUERIES:

1. Get all notifications for user:
   collection('notifications')
     .where('userId', '==', userId)
     .orderBy('date', 'desc')
   Result: ~50-100 docs per active parent

2. Get personal + class notifications:
   collection('notifications')
     .where('userId', '==', userId)  // Personal
     UNION
   collection('notifications')
     .where('userId', '==', 'all')   // Broadcast
     .where('recipientRole', '==', 'parent')

3. Get unread count for dashboard badge:
   Firestore count: UNREAD notifications

INDEXES RECOMMENDED:
- notifications: (userId, date DESC)
- notifications: (school_id, date DESC)
- notifications: (recipientRole, date DESC)

ON DELETE POLICY (Future):
- Archive after 30 days
- Hard delete after 90 days
- Or implement soft delete with status field
```

---

## Error Handling

```
Errors Handled:

1. Loading Error:
   ├─ Display: "Loading notifications..."
   ├─ Show: Bell animation
   └─ User can: Wait or refresh

2. Firestore Error:
   ├─ Display: "Error loading notifications"
   ├─ Show: Error message + icon
   ├─ Log: Error to console
   └─ User can: Click refresh

3. No Data:
   ├─ Display: Bell with "No Notifications"
   ├─ Icon: Gray outline
   └─ Message: "Check back soon for updates"

4. Search Error:
   ├─ Display: "No results matching..."
   ├─ Clear search to see all
   └─ Auto-clears on category select

5. Mark As Read Error:
   ├─ Silently retry
   ├─ Log error
   └─ UI reverts to previous state
```

---

## Performance Optimizations

```
Current:
✅ Lazy load - Only fetches when hook mounts
✅ Efficient queries - Indexed Firestore
✅ Memoized - useMemo for filtering
✅ De-duplication - Remove duplicate parent IDs
✅ Sorting - Done server-side (date DESC)

Future Enhancements:
- Pagination - Load 20, then more on scroll
- Real-time listeners - onSnapshot() for live updates
- Caching - Cache results for 30 seconds
- Batch operations - Bulk mark as read
- Search optimization - Firestore text search
```

---

## Mobile Responsiveness

```
Desktop (>1024px):
├─ Header: Normal
├─ Dashboard: 3-column layout
├─ Notification Widget: 500px tall
└─ Full Page: 100vh - 250px

Tablet (768px-1023px):
├─ Header: Compact
├─ Dashboard: 2-column layout  
├─ Notification Widget: 400px tall
└─ Full Page: Adjusted

Mobile (<768px):
├─ Header: Minimalist
├─ Dashboard: Single column
├─ Notification Widget: max-h-[300px]
└─ Full Page: Full height
   ├─ Sticky header
   ├─ Scrollable list
   └─ Touch-friendly buttons
```

---

## API Reference (Services)

```typescript
// notificationAggregator (8 methods)
├─ createExamResultNotification() → Notification
├─ createAnnouncementNotification() → Notification
├─ createFeeReminderNotification() → Notification
├─ createEventAlertNotification() → Notification
├─ createAssignmentNotification() → Notification
├─ createAttendanceNotification() → Notification
└─ createBulkNotification() → Notification[]

// useAggregatedNotifications hook (7 methods + state)
├─ State:
│  ├─ allNotifications: Notification[]
│  ├─ categories: NotificationCategory[]
│  ├─ stats: CategoryStats
│  ├─ unreadCount: number
│  ├─ loading: boolean
│  └─ error: string | null
├─ Methods:
│  ├─ refresh() → Promise<void>
│  ├─ markAsRead(id) → Promise<void>
│  ├─ markAllAsRead() → Promise<void>
│  ├─ getCategoryStats(type) → number
│  ├─ getNotificationsByCategory(type, limit?) → Notification[]
│  ├─ getRecentNotifications(limit?) → Notification[]
│  └─ getUnreadNotifications() → Notification[]

// ParentNotificationPanel component (1 component)
├─ Props:
│  ├─ onClose?: () => void
│  ├─ className?: string
│  ├─ maxHeight?: string
│  ├─ showHeader?: boolean
│  └─ compact?: boolean
```

---

## Summary

- **Scalable**: Uses Firestore queries efficiently
- **Real-time Ready**: Can add listeners later
- **Type-safe**: Full TypeScript support
- **Accessible**: WCAG compliance
- **Responsive**: Mobile, tablet, desktop
- **Error Resilient**: Graceful error handling
- **Developer Friendly**: Well-documented code
- **Production Ready**: Thoroughly tested
