# Common Components Library

This directory contains reusable UI components for the School Management System.

## 📦 Available Components

### 1. PageHeader
Standardized page header with optional icon, subtitle, back button, and actions.

**Usage:**
```tsx
import { PageHeader } from './common/PageHeader';
import { BookOpen } from 'lucide-react';

<PageHeader
  title="Lesson Log"
  subtitle="View and manage your lesson logs"
  icon={BookOpen}
  variant="gradient" // or "default"
  onBack={() => setCurrentView('dashboard')}
  actions={
    <button className="px-4 py-2 bg-white/20 rounded-lg">
      Add Lesson
    </button>
  }
/>
```

**Props:**
- `title` (string, required): Main heading text
- `subtitle` (string, optional): Secondary text below title
- `icon` (LucideIcon, optional): Icon component to display
- `variant` ('default' | 'gradient', optional): Visual style
- `onBack` (function, optional): Callback for back button
- `actions` (ReactNode, optional): Action buttons area

---

### 2. ButtonStyles
Standardized button class strings for consistent styling.

**Usage:**
```tsx
import { buttonStyles } from './common/ButtonStyles';

// Primary button
<button className={buttonStyles.primary}>Save</button>

// Secondary button
<button className={buttonStyles.secondary}>Cancel</button>

// Success button
<button className={buttonStyles.success}>Approve</button>

// Danger button
<button className={buttonStyles.danger}>Delete</button>

// Outline button
<button className={buttonStyles.outline}>Edit</button>

// Size variants
<button className={buttonStyles.primarySm}>Small Button</button>
<button className={buttonStyles.primaryLg}>Large Button</button>
```

**Available Styles:**
- `primary` - Purple background (default size)
- `primarySm` - Purple background (small)
- `primaryLg` - Purple background (large)
- `secondary` - Gray background
- `secondarySm` - Gray background (small)
- `success` - Green background
- `danger` - Red background
- `outline` - Purple border
- `ghost` - Transparent with hover
- `icon` - Icon-only button
- `iconPrimary` - Icon-only purple button
- `disabled` - Disabled state

---

### 3. CardStyles
Standardized card class strings.

**Usage:**
```tsx
import { cardStyles } from './common/ButtonStyles';

// Basic card
<div className={cardStyles.base}>Content here</div>

// Hoverable card
<div className={cardStyles.hover}>Interactive content</div>

// Bordered card
<div className={cardStyles.bordered}>Bordered content</div>

// Gradient card
<div className={cardStyles.gradient}>Header content</div>
```

**Available Styles:**
- `base` - White card with shadow
- `hover` - Card with hover effect
- `bordered` - Card with border
- `gradient` - Purple gradient card

---

### 4. InputStyles
Standardized input field class strings.

**Usage:**
```tsx
import { inputStyles } from './common/ButtonStyles';

// Normal input
<input className={inputStyles.base} />

// Error state
<input className={inputStyles.error} />

// Disabled input
<input className={inputStyles.disabled} disabled />
```

**Available Styles:**
- `base` - Standard input with focus ring
- `error` - Red border for errors
- `disabled` - Grayed out disabled state

---

### 5. BadgeStyles
Standardized badge class strings.

**Usage:**
```tsx
import { badgeStyles } from './common/ButtonStyles';

<span className={badgeStyles.success}>Active</span>
<span className={badgeStyles.warning}>Pending</span>
<span className={badgeStyles.error}>Overdue</span>
<span className={badgeStyles.info}>New</span>
<span className={badgeStyles.purple}>Featured</span>
```

**Available Styles:**
- `success` - Green badge
- `warning` - Orange badge
- `error` - Red badge
- `info` - Blue badge
- `purple` - Purple badge

---

### 6. LoadingSpinner
Animated loading spinner with multiple sizes and colors.

**Usage:**
```tsx
import { LoadingSpinner, LoadingScreen, LoadingOverlay } from './common/LoadingSpinner';

// Simple spinner
<LoadingSpinner size="md" color="purple" />

// Spinner with text
<LoadingSpinner size="lg" color="purple" text="Loading data..." />

// Full screen loading
<LoadingScreen text="Please wait..." />

// Modal overlay loading
<LoadingOverlay text="Processing..." />
```

**LoadingSpinner Props:**
- `size` ('sm' | 'md' | 'lg', optional): Spinner size
- `color` ('purple' | 'white' | 'gray', optional): Spinner color
- `text` (string, optional): Loading message

**LoadingScreen Props:**
- `text` (string, optional): Loading message

**LoadingOverlay Props:**
- `text` (string, optional): Loading message

---

### 7. EmptyState
Component for displaying empty states with icon, title, description, and optional action.

**Usage:**
```tsx
import { EmptyState } from './common/EmptyState';
import { BookOpen } from 'lucide-react';

<EmptyState
  icon={BookOpen}
  title="No Lessons Found"
  description="You haven't logged any lessons yet. Start by creating your first lesson."
  action={{
    label: "Create Lesson",
    onClick: () => setShowForm(true)
  }}
/>
```

**Props:**
- `icon` (LucideIcon, required): Icon component
- `title` (string, required): Main heading
- `description` (string, required): Explanation text
- `action` (object, optional): Action button configuration
  - `label` (string): Button text
  - `onClick` (function): Click handler

---

## 🎨 Design Tokens

### Colors
```typescript
Primary Purple:   #7C3AED (purple-600), #6D28D9 (purple-700)
Secondary Gray:   #E5E7EB (gray-200), #374151 (gray-700)
Success Green:    #16A34A (green-600)
Error Red:        #DC2626 (red-600)
Warning Orange:   #EA580C (orange-600)
Info Blue:        #2563EB (blue-600)
```

### Spacing
```typescript
Section gaps:     space-y-6
Card padding:     p-6 (standard), p-8 (large)
Grid gaps:        gap-4 (dense), gap-6 (normal)
Button padding:   px-6 py-2.5 (standard), px-4 py-2 (small)
```

### Border Radius
```typescript
Cards:    rounded-xl
Buttons:  rounded-lg
Badges:   rounded-full
Inputs:   rounded-lg
```

### Shadows
```typescript
Cards:       shadow-md
Elevated:    shadow-lg
Hover:       hover:shadow-xl
```

---

## 💡 Best Practices

### 1. Always Use Common Components
```tsx
// ✅ Good
import { buttonStyles } from './common/ButtonStyles';
<button className={buttonStyles.primary}>Save</button>

// ❌ Avoid
<button className="px-6 py-2 bg-purple-600 text-white rounded-lg">Save</button>
```

### 2. Use PageHeader for Consistent Headers
```tsx
// ✅ Good
<PageHeader
  title="Student Management"
  subtitle="Manage student records"
  icon={Users}
/>

// ❌ Avoid
<div className="p-6">
  <h2>Student Management</h2>
  <p>Manage student records</p>
</div>
```

### 3. Use EmptyState for No Data
```tsx
// ✅ Good
{students.length === 0 && (
  <EmptyState
    icon={Users}
    title="No Students"
    description="Add your first student"
  />
)}

// ❌ Avoid
{students.length === 0 && <p>No students found</p>}
```

### 4. Use Loading Components
```tsx
// ✅ Good
{loading && <LoadingScreen text="Loading students..." />}

// ❌ Avoid
{loading && <div>Loading...</div>}
```

---

## 🚀 Quick Start

1. **Import the component:**
```tsx
import { PageHeader } from './common/PageHeader';
```

2. **Use in your JSX:**
```tsx
<PageHeader title="My Page" subtitle="Page description" />
```

3. **Customize with props:**
```tsx
<PageHeader
  title="My Page"
  subtitle="Page description"
  icon={BookOpen}
  variant="gradient"
  onBack={() => navigate(-1)}
  actions={<button>Action</button>}
/>
```

---

## 📚 Examples

### Complete Page Example
```tsx
import { PageHeader } from './common/PageHeader';
import { buttonStyles, cardStyles } from './common/ButtonStyles';
import { EmptyState } from './common/EmptyState';
import { LoadingScreen } from './common/LoadingSpinner';
import { BookOpen, Plus } from 'lucide-react';

function LessonPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen text="Loading lessons..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson Log"
        subtitle="View and manage your lessons"
        icon={BookOpen}
        variant="gradient"
        onBack={() => navigate('/dashboard')}
        actions={
          <button className={buttonStyles.primary}>
            <Plus className="w-5 h-5 mr-2" />
            Add Lesson
          </button>
        }
      />

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Lessons Yet"
          description="Start by creating your first lesson"
          action={{
            label: "Create Lesson",
            onClick: () => setShowForm(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map(lesson => (
            <div key={lesson.id} className={cardStyles.hover}>
              {/* Lesson content */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Updates

When adding new common components:

1. Add the component file to `/components/common/`
2. Export it from the appropriate file
3. Document it in this README
4. Add usage examples
5. Update the imports in the Quick Start section

---

**Last Updated**: February 27, 2026
**Maintained By**: Development Team
