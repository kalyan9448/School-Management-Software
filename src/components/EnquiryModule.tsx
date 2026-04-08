import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Calendar, CheckCircle, Clock, Bell, AlertCircle, X, Grid3x3, List, Trash2, MessageCircle } from 'lucide-react';
import { enquiryService } from '../utils/centralDataService';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { useTenant } from '../contexts/TenantContext';

import { Enquiry } from '../utils/centralDataService';

interface EnquiryModuleProps {
  onConvert?: (enquiry: Enquiry) => void;
}

export function EnquiryModule({ onConvert }: EnquiryModuleProps = {}) {
  const { schoolName } = useTenant();
  const { uniqueClasses } = useAcademicClasses();
  const [showForm, setShowForm] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load enquiries from backend
  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await enquiryService.getAll();
      setEnquiries(data || []);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    email: '',
    studentName: '',
    classApplied: '',
    followUpDate: '',
    notes: '',
  });

  // Calculate follow-up reminders
  const getFollowUpReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = enquiries
      .filter(e => e.status === 'new' && e.followUpDate)
      .map(e => {
        const followUpDate = new Date(e.followUpDate || '');
        followUpDate.setHours(0, 0, 0, 0);
        const diffTime = followUpDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...e,
          daysUntilFollowUp: diffDays,
        };
      })
      .filter(e => e.daysUntilFollowUp <= 3) // Show reminders for next 3 days and overdue
      .sort((a, b) => a.daysUntilFollowUp - b.daysUntilFollowUp);

    return reminders;
  };

  const followUpReminders = getFollowUpReminders();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enquiryService.create({
        ...formData,
        enquiryDate: new Date().toISOString().split('T')[0],
        status: 'new' as const,
        source: 'walk-in' as const,
      });
      await loadEnquiries();

      setFormData({
        parentName: '',
        phone: '',
        email: '',
        studentName: '',
        classApplied: '',
        followUpDate: '',
        notes: '',
      });
      setShowForm(false);
      alert('Enquiry added successfully!');
    } catch (error) {
      console.error('Create enquiry error:', error);
      alert('Failed to create enquiry. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Enquiry['status']) => {
    try {
      await enquiryService.update(id, { status: newStatus });
      setEnquiries(prev => prev.map(e =>
        e.id === id ? { ...e, status: newStatus } : e
      ));
    } catch (error) {
      console.error('Failed to update enquiry status:', error);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        await enquiryService.delete(id);
        setEnquiries(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error('Failed to delete enquiry:', error);
      }
    }
  };

  const handleWhatsApp = (enquiry: Enquiry | any) => {
    const cleanPhone = enquiry.phone.replace(/\D/g, '');
    const student = enquiry.studentName || enquiry.childName || 'the student';
    const parent = enquiry.parentName || 'Parent';
    const cls = enquiry.classApplied || enquiry.classInterest || '';
    
    let message = '';
    const status = (enquiry.status || '').toLowerCase();

    if (status === 'converted') {
      message = `Hi ${parent}, welcome to ${schoolName || 'our school'}! We've successfully processed the admission for ${student}. We look forward to having them with us.`;
    } else if (status === 'contacted' || status === 'followed-up') {
      message = `Hi ${parent}, checking back in on your enquiry for ${student}. Do you have any further questions about our admission process at ${schoolName || 'the school'}?`;
    } else {
      message = `Hi ${parent}, thank you for inquiring about admission for ${student} ${cls ? `to Class ${cls}` : ''} at ${schoolName || 'our school'}. We'd love to discuss this further with you!`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-yellow-100 text-yellow-700',
      contacted: 'bg-blue-100 text-blue-700',
      visited: 'bg-indigo-100 text-indigo-700',
      converted: 'bg-green-100 text-green-700',
      lost: 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  const getReminderStyle = (daysUntil: number) => {
    if (daysUntil < 0) {
      return {
        bg: 'bg-gradient-to-r from-red-50 to-orange-50',
        border: 'border-red-500',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        badge: 'bg-red-100 text-red-700',
        badgeText: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) > 1 ? 's' : ''} overdue`,
      };
    } else if (daysUntil === 0) {
      return {
        bg: 'bg-gradient-to-r from-orange-50 to-yellow-50',
        border: 'border-orange-500',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700',
        badgeText: 'Today',
      };
    } else if (daysUntil === 1) {
      return {
        bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        border: 'border-yellow-500',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700',
        badgeText: 'Tomorrow',
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-blue-500',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        badgeText: `In ${daysUntil} days`,
      };
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry =>
    enquiry.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.phone.includes(searchTerm)
  );

  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Enquiry Management</h1>
          <p className="text-gray-600">Track and follow-up with admission enquiries</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Reminders Bell Button */}
          {followUpReminders.length > 0 && (
            <button
              onClick={() => setShowReminders(true)}
              className="relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 animate-pulse"
            >
              <Bell className="w-5 h-5" />
              <span>{followUpReminders.length} Reminder{followUpReminders.length > 1 ? 's' : ''}</span>
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                {followUpReminders.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            New Enquiry
          </button>
        </div>
      </div>

      {/* Follow-up Reminders Popup */}
      {showReminders && followUpReminders.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setShowReminders(false)}
          ></div>

          {/* Popup Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
              {/* Popup Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white mb-1">Follow-up Reminders</h2>
                      <p className="text-orange-100">{followUpReminders.length} pending follow-up{followUpReminders.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReminders(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Popup Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  {followUpReminders.map((reminder) => {
                    const style = getReminderStyle(reminder.daysUntilFollowUp);
                    return (
                      <div
                        key={reminder.id}
                        className={`relative overflow-hidden ${style.bg} rounded-3xl shadow-lg border-l-8 ${style.border} p-6 hover:shadow-2xl transition-all`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full"></div>
                        <div className="relative flex items-start gap-4">
                          <div className={`w-14 h-14 ${style.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transform rotate-6`}>
                            {reminder.daysUntilFollowUp < 0 ? (
                              <AlertCircle className={`w-7 h-7 ${style.iconColor}`} />
                            ) : (
                              <Clock className={`w-7 h-7 ${style.iconColor}`} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-gray-900 mb-1">{reminder.studentName}</h3>
                                <p className="text-gray-700">Parent: {reminder.parentName}</p>
                              </div>
                              <span className={`px-4 py-2 rounded-full ${style.badge} whitespace-nowrap border-2`}>
                                {style.badgeText}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl">
                                <Phone className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-700">{reminder.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-700">Follow-up: {reminder.followUpDate}</span>
                              </div>
                              <div className="p-2 bg-white/50 rounded-xl text-gray-700">
                                <span>Class {reminder.classApplied} Interest</span>
                              </div>
                            </div>

                            {reminder.notes && (
                              <div className="bg-white/70 rounded-2xl p-3 mb-3">
                                <p className="text-gray-700">{reminder.notes}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  handleStatusChange(reminder.id, 'contacted');
                                  // Close popup if no more reminders
                                  if (followUpReminders.length === 1) {
                                    setShowReminders(false);
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-md"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark as Followed Up
                              </button>
                              <a
                                href={`tel:${reminder.phone}`}
                                className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                              >
                                <Phone className="w-4 h-4" />
                                Call Now
                              </a>
                              {reminder.email && (
                                <a
                                  href={`mailto:${reminder.email}`}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Email
                                </a>
                              )}
                              <button
                                onClick={() => handleWhatsApp(reminder)}
                                className="px-6 py-2.5 bg-[#25D366] text-white rounded-2xl hover:bg-[#128C7E] transition-all flex items-center gap-2 shadow-lg shadow-[#25D366]/30 hover:scale-105 active:scale-95 font-bold text-sm"
                              >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-purple-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-gray-600 mb-1">Total Enquiries</p>
            <p className="text-gray-900">{enquiries.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-yellow-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-yellow-700 mb-1">New Enquiries</p>
            <p className="text-yellow-900">{enquiries.filter(e => e.status === 'new').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-indigo-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-indigo-700 mb-1">Contacted</p>
            <p className="text-indigo-900">{enquiries.filter(e => e.status === 'contacted').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border-4 border-green-200 p-5 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-green-300 rounded-bl-full opacity-50"></div>
          <div className="relative">
            <p className="text-green-700 mb-1">Converted</p>
            <p className="text-green-900">{enquiries.filter(e => e.status === 'converted').length}</p>
          </div>
        </div>
      </div>

      {/* New Enquiry Form Popup */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setShowForm(false)}
          ></div>

          {/* Popup Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
              {/* Popup Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 shadow-lg z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white mb-1">New Enquiry</h2>
                      <p className="text-purple-100">Add a new admission enquiry</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Popup Content */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-160px)]">
                <form id="enquiry-form" onSubmit={handleSubmit} className="p-6 space-y-6 pb-24">

                  {/* Parent Information Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
                    <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      Parent Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Parent Name *</label>
                        <input
                          type="text"
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter parent name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="e.g., 9876543210"
                            maxLength={10}
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">Email ID</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="parent@email.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Child Information Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
                    <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      Child Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Child Name *</label>
                        <input
                          type="text"
                          value={formData.studentName}
                          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter child name"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Class of Interest *</label>
                        <select
                          value={formData.classApplied}
                          onChange={(e) => setFormData({ ...formData, classApplied: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Class</option>
                          {uniqueClasses.map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Section */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
                    <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      Follow-up Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Follow-up Date</label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="Add any additional notes or special requirements..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                </form>
              </div>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-6 flex gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
                >
                  Discard
                </button>
                <button
                  form="enquiry-form"
                  type="submit"
                  className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Enquiry
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by parent name, child name, or phone..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Enquiries Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="relative overflow-hidden bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-purple-300 p-5 hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-bl-full opacity-30"></div>
              <div className="relative space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-1 truncate">
                      {(enquiry as any).studentName || (enquiry as any).childName || 'Unnamed Enquiry'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {(enquiry as any).classApplied || (enquiry as any).classInterest ? `Class ${(enquiry as any).classApplied || (enquiry as any).classInterest} Interest` : 'Admission Interest'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadge(enquiry.status)}`}>
                      {enquiry.status ? enquiry.status.toUpperCase() : 'NEW'}
                    </span>
                    <button
                      onClick={() => handleDeleteEnquiry(enquiry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-xl">
                    <Phone className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 truncate">{enquiry.parentName}</p>
                      <p className="text-gray-600">{enquiry.phone}</p>
                    </div>
                  </div>

                  {enquiry.email && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                      <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-gray-900 truncate">{enquiry.email}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <p className="text-gray-900">Follow-up: {enquiry.followUpDate}</p>
                  </div>
                </div>

                {enquiry.notes && (
                  <div className="bg-gray-50 rounded-xl p-2">
                    <p className="text-gray-700">{enquiry.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleStatusChange(enquiry.id, 'contacted')}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Follow Up
                  </button>
                  <button
                    onClick={() => onConvert ? onConvert(enquiry) : handleStatusChange(enquiry.id, 'converted')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Convert
                  </button>
                  <button
                    onClick={() => handleWhatsApp(enquiry)}
                    className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold"
                    title="Connect on WhatsApp"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span className="text-white">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-purple-300 p-4 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getStatusBadge(enquiry.status)}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>

                 <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <div>
                    <h4 className="text-gray-900 truncate">
                      {(enquiry as any).studentName || (enquiry as any).childName || 'Unnamed'}
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Class {(enquiry as any).classApplied || (enquiry as any).classInterest || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Parent</p>
                    <p className="text-gray-900 truncate">{enquiry.parentName}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{enquiry.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Follow-up</p>
                    <p className="text-gray-900">{enquiry.followUpDate}</p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-xl border ${getStatusBadge(enquiry.status)}`}>
                      {enquiry.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(enquiry.id, 'contacted')}
                    className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    title="Mark as Contacted"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onConvert ? onConvert(enquiry) : handleStatusChange(enquiry.id, 'converted')}
                    className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    title="Convert to Admission"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleWhatsApp(enquiry)}
                    className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    title="WhatsApp Connect"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDeleteEnquiry(enquiry.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="Delete Enquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredEnquiries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl shadow-lg border-2 border-gray-100">
          <p className="text-gray-500">No enquiries found</p>
        </div>
      )}
    </div>
  );
}