import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Eye,
  Volume2,
  Moon,
  Sun,
  Monitor,
  ArrowLeft,
  Check,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { useNavigate } from "react-router";
import { SettingsService } from "@/services/student/studentDataService";

type SettingItem = 
  | { id: string; label: string; description: string; type: "toggle"; value: boolean; onChange: () => void; icon?: LucideIcon }
  | { id: string; label: string; description: string; type: "select"; value: string; options: { value: string; label: string; icon?: LucideIcon }[]; onChange: (val: string) => void; icon?: LucideIcon }
  | { id: string; label: string; description: string; type: "action"; icon: LucideIcon; onClick?: () => void };

interface SettingsSection {
  title: string;
  icon: LucideIcon;
  items: SettingItem[];
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<"2fa" | "password" | "privacy" | "delete" | "terms" | "privacyPolicy" | null>(null);
  const [settings, setSettings] = useState<any>({
    notifications: { quizReminders: true, assignmentDue: true, weeklyReport: false },
    theme: "light",
    language: "en",
    soundEnabled: true,
  });

  useEffect(() => {
    SettingsService.get().then(setSettings);
  }, []);

  const handleDownloadData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateSettings = async (updates: any) => {
    const updated = await SettingsService.update(updates);
    setSettings(updated);
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          id: "quizReminders",
          label: "Quiz Reminders",
          description: "Get notified about upcoming quizzes",
          type: "toggle",
          value: settings.notifications.quizReminders,
          onChange: () =>
            updateSettings({
              notifications: {
                ...settings.notifications,
                quizReminders: !settings.notifications.quizReminders,
              },
            }),
        },
        {
          id: "assignmentDue",
          label: "Assignment Due Dates",
          description: "Reminders for assignment deadlines",
          type: "toggle",
          value: settings.notifications.assignmentDue,
          onChange: () =>
            updateSettings({
              notifications: {
                ...settings.notifications,
                assignmentDue: !settings.notifications.assignmentDue,
              },
            }),
        },
        {
          id: "weeklyReport",
          label: "Weekly Progress Report",
          description: "Receive weekly summary of your progress",
          type: "toggle",
          value: settings.notifications.weeklyReport,
          onChange: () =>
            updateSettings({
              notifications: {
                ...settings.notifications,
                weeklyReport: !settings.notifications.weeklyReport,
              },
            }),
        },
      ],
    },
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          id: "theme",
          label: "Theme",
          description: "Choose your preferred theme",
          type: "select",
          value: settings.theme,
          options: [
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ],
          onChange: (val: string) => {
            updateSettings({ theme: val });
            if (val === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          },
        },
      ],
    },
    {
      title: "Language & Region",
      icon: Globe,
      items: [
        {
          id: "language",
          label: "Language",
          description: "Select your preferred language",
          type: "select",
          value: settings.language,
          options: [
            { value: "en", label: "English" },
          ],
          onChange: (val: string) => updateSettings({ language: val }),
        },
      ],
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      items: [
        {
          id: "changePassword",
          label: "Change Password",
          description: "Update your account password",
          type: "action",
          icon: Lock,
          onClick: () => setActiveModal("password"),
        },
        {
          id: "privacySettings",
          label: "Privacy Settings",
          description: "Manage who can see your profile",
          type: "action",
          icon: Eye,
          onClick: () => setActiveModal("privacy"),
        },
      ],
    },
    {
      title: "Sound & Audio",
      icon: Volume2,
      items: [
        {
          id: "sound",
          label: "Sound Effects",
          description: "Enable sound effects for interactions",
          type: "toggle",
          value: settings.soundEnabled,
          onChange: () => updateSettings({ soundEnabled: !settings.soundEnabled }),
        },
      ],
    },
  ];

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{
        background: checked ? '#1F6FEB' : '#E6ECF5',
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAFBFF' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} className="text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-white/90 text-sm mt-1">Customize your learning experience</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ background: '#CFE8FF' }}>
                    <SectionIcon className="w-5 h-5" style={{ color: '#1F6FEB' }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                    {section.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors ${item.type === 'action' ? 'cursor-pointer' : ''}`}
                      style={{ border: '1px solid #E6ECF5' }}
                      onClick={item.type === "action" ? (item as any).onClick : undefined}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const ItemIcon = (item as any).icon;
                            return ItemIcon ? (
                              <ItemIcon className="w-4 h-4" style={{ color: '#7A869A' }} />
                            ) : null;
                          })()}
                          <p className="font-medium" style={{ color: '#1A1A1A' }}>
                            {item.label}
                          </p>
                        </div>
                        <p className="text-sm mt-1" style={{ color: '#7A869A' }}>
                          {item.description}
                        </p>
                      </div>

                      <div className="ml-4">
                        {item.type === "toggle" && (
                          <ToggleSwitch checked={item.value} onChange={item.onChange} />
                        )}

                        {item.type === "select" && item.options && (
                          <div className="flex gap-2">
                            {item.options.map((option) => {
                              const OptionIcon = option.icon;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => item.onChange(option.value)}
                                  className="relative px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                                  style={{
                                    background: item.value === option.value ? '#1F6FEB' : '#FAFBFF',
                                    color: item.value === option.value ? '#fff' : '#7A869A',
                                    border: `1px solid ${item.value === option.value ? '#1F6FEB' : '#E6ECF5'}`,
                                  }}
                                >
                                  {OptionIcon && <OptionIcon className="w-4 h-4" />}
                                  <span className="text-sm">{option.label}</span>
                                  {item.value === option.value && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {item.type === "action" && (
                          <Button
                            variant="outline"
                            size="sm"
                            style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                            onClick={item.onClick}
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>
              Account Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                style={{ borderColor: '#E6ECF5' }}
                onClick={handleDownloadData}
              >
                <Shield className="w-4 h-4 mr-2" style={{ color: '#1F6FEB' }} />
                Download My Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                style={{ borderColor: '#E6ECF5' }}
                onClick={() => setActiveModal("2fa")}
              >
                <Lock className="w-4 h-4 mr-2" style={{ color: '#1F6FEB' }} />
                Two-Factor Authentication
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setActiveModal("delete")}
              >
                <span className="mr-2">⚠️</span>
                Delete Account
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* App Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 text-center">
            <p className="text-sm" style={{ color: '#7A869A' }}>Student Dashboard v1.0.0</p>
            <p className="text-xs mt-2" style={{ color: '#7A869A' }}>
              © 2024 Student Portal. All rights reserved.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button className="text-sm" style={{ color: '#1F6FEB' }} onClick={() => setActiveModal("terms")}>
                Terms of Service
              </button>
              <span style={{ color: '#E6ECF5' }}>|</span>
              <button className="text-sm" style={{ color: '#1F6FEB' }} onClick={() => setActiveModal("privacyPolicy")}>
                Privacy Policy
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              {activeModal === "2fa" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Two-Factor Authentication</h2>
                  <p className="text-gray-600 mb-6 text-sm">Scan the QR code with your authenticator app to enable 2FA.</p>
                  <div className="bg-gray-100 h-40 w-40 mx-auto rounded-lg mb-6 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-gray-400 text-sm">QR Code</span>
                  </div>
                  <Button className="w-full" onClick={() => setActiveModal(null)}>Close</Button>
                </>
              )}
              {activeModal === "password" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Change Password</h2>
                  <div className="space-y-4 mb-6">
                    <input type="password" placeholder="Current Password" className="w-full p-3 border rounded-xl text-sm" style={{ borderColor: '#E6ECF5' }} />
                    <input type="password" placeholder="New Password" className="w-full p-3 border rounded-xl text-sm" style={{ borderColor: '#E6ECF5' }} />
                    <input type="password" placeholder="Confirm New Password" className="w-full p-3 border rounded-xl text-sm" style={{ borderColor: '#E6ECF5' }} />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => setActiveModal(null)}>Save Changes</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button>
                  </div>
                </>
              )}
              {activeModal === "privacy" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Privacy Settings</h2>
                  <div className="space-y-6 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profile Visibility</span>
                      <select className="p-2 border rounded-lg text-sm outline-none" style={{ borderColor: '#E6ECF5' }}>
                        <option>Public</option>
                        <option>School Only</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Show Activity Status</span>
                      <ToggleSwitch checked={true} onChange={() => {}} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setActiveModal(null)}>Done</Button>
                </>
              )}
              {activeModal === "delete" && (
                <>
                  <h2 className="text-xl font-bold mb-4 text-red-600">Delete Account</h2>
                  <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-red-600 text-white hover:bg-red-700 border-red-600" onClick={() => setActiveModal(null)}>Confirm Delete</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button>
                  </div>
                </>
              )}
              {activeModal === "terms" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Terms of Service</h2>
                  <div className="text-sm text-gray-600 mb-6 max-h-60 overflow-y-auto space-y-3 pr-2">
                    <p>Welcome to the Student Dashboard. By accessing or using our platform, you agree to comply with and be bound by the following terms.</p>
                    <p><strong>1. Use of Service:</strong> You must use the service responsibly for educational purposes only. Do not share your account credentials with anyone.</p>
                    <p><strong>2. User Content:</strong> Any materials uploaded must be your own work. Plagiarism or uploading copyrighted materials without permission is strictly prohibited.</p>
                    <p><strong>3. Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in disruptive behavior.</p>
                    <p>If you have any questions about these terms, please contact the administration.</p>
                  </div>
                  <Button className="w-full" onClick={() => setActiveModal(null)}>I Understand</Button>
                </>
              )}
              {activeModal === "privacyPolicy" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Privacy Policy</h2>
                  <div className="text-sm text-gray-600 mb-6 max-h-60 overflow-y-auto space-y-3 pr-2">
                    <p>Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.</p>
                    <p><strong>1. Data Collection:</strong> We collect information you provide directly to us, such as when you create an account, update your profile, or submit assignments.</p>
                    <p><strong>2. Data Usage:</strong> Your data is used exclusively to provide and improve the educational platform, personalize your learning experience, and communicate important updates.</p>
                    <p><strong>3. Data Protection:</strong> We implement robust security measures to protect your information from unauthorized access or disclosure.</p>
                    <p><strong>4. Third Parties:</strong> We do not sell your personal data. Data is only shared with trusted third-party services that are essential for platform operations.</p>
                  </div>
                  <Button className="w-full" onClick={() => setActiveModal(null)}>Close</Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
