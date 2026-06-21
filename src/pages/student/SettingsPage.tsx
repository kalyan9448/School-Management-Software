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
  ArrowLeft,
  Check,
  LucideIcon,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { useNavigate } from "react-router";
import {
  SettingsService,
  StudentProfile,
  HomeworkService,
  QuizService,
  AttendanceService,
  TimelineService,
} from "@/services/student/studentDataService";

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
    privacy: { profileVisibility: "School Only", showActivityStatus: true },
    welcomeBannerDismissed: false,
  });

  // ── Load settings from Firestore ────────────────────────────────────────────
  useEffect(() => {
    SettingsService.get().then(setSettings);
  }, []);

  // ── Change Password state ────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwForm.current) { setPwError("Please enter your current password."); return; }
    if (pwForm.newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      const { auth } = await import("@/services/firebase");
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, pwForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwForm.newPw);
      setPwSuccess(true);
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => { setPwSuccess(false); setActiveModal(null); }, 2000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password is incorrect.");
      } else {
        setPwError("Failed to update password. Please try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete Account state ─────────────────────────────────────────────────────
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteError("");
    const { auth } = await import("@/services/firebase");
    const user = auth.currentUser;
    if (!user || deleteConfirmEmail.trim() !== user.email) {
      setDeleteError("Email does not match your account. Please type it exactly.");
      return;
    }
    setDeleteLoading(true);
    try {
      // 1. Wipe student_portal Firestore data
      const { db } = await import("@/services/firebase");
      const { collection, getDocs, deleteDoc } = await import("firebase/firestore");
      const dataRef = collection(db, "student_portal", user.uid, "data");
      const snap = await getDocs(dataRef);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      // 2. Delete Firebase Auth account
      const { deleteUser } = await import("firebase/auth");
      await deleteUser(user);
      // 3. Redirect to login
      window.location.href = "/login";
    } catch (err: any) {
      setDeleteError("Failed to delete account. You may need to sign out and sign in again first.");
      setDeleteLoading(false);
    }
  };

  // ── Download all student data ────────────────────────────────────────────────
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownloadData = async () => {
    setDownloadLoading(true);
    try {
      const [profile, homework, quizResults, attendance, timeline] = await Promise.allSettled([
        StudentProfile.get(),
        HomeworkService.getAll(),
        QuizService.getResults(),
        AttendanceService.get(),
        TimelineService.getAll(),
      ]);
      const bundle = {
        exportedAt: new Date().toISOString(),
        profile: profile.status === "fulfilled" ? profile.value : null,
        homework: homework.status === "fulfilled" ? homework.value : [],
        quizResults: quizResults.status === "fulfilled" ? quizResults.value : [],
        attendance: attendance.status === "fulfilled" ? attendance.value : null,
        timeline: timeline.status === "fulfilled" ? timeline.value : [],
        settings,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student_data_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadLoading(false);
    }
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
            if (val === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
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
          options: [{ value: "en", label: "English" }],
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
          onClick: () => {
            setPwForm({ current: "", newPw: "", confirm: "" });
            setPwError("");
            setPwSuccess(false);
            setActiveModal("password");
          },
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
      style={{ background: checked ? "#1F6FEB" : "#E6ECF5" }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const privacySettings = settings.privacy || { profileVisibility: "School Only", showActivityStatus: true };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FAFBFF" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(to right, #0A2540, #1F6FEB)" }} className="text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
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
                  <div className="p-2 rounded-lg" style={{ background: "#CFE8FF" }}>
                    <SectionIcon className="w-5 h-5" style={{ color: "#1F6FEB" }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
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
                      className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors ${item.type === "action" ? "cursor-pointer" : ""}`}
                      style={{ border: "1px solid #E6ECF5" }}
                      onClick={item.type === "action" ? (item as any).onClick : undefined}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const ItemIcon = (item as any).icon;
                            return ItemIcon ? <ItemIcon className="w-4 h-4" style={{ color: "#7A869A" }} /> : null;
                          })()}
                          <p className="font-medium" style={{ color: "#1A1A1A" }}>
                            {item.label}
                          </p>
                        </div>
                        <p className="text-sm mt-1" style={{ color: "#7A869A" }}>
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
                                    background: item.value === option.value ? "#1F6FEB" : "#FAFBFF",
                                    color: item.value === option.value ? "#fff" : "#7A869A",
                                    border: `1px solid ${item.value === option.value ? "#1F6FEB" : "#E6ECF5"}`,
                                  }}
                                >
                                  {OptionIcon && <OptionIcon className="w-4 h-4" />}
                                  <span className="text-sm">{option.label}</span>
                                  {item.value === option.value && <Check className="w-4 h-4" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {item.type === "action" && (
                          <Button
                            variant="outline"
                            size="sm"
                            style={{ borderColor: "#1F6FEB", color: "#1F6FEB" }}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1A1A1A" }}>
              Account Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                style={{ borderColor: "#E6ECF5" }}
                onClick={handleDownloadData}
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                ) : (
                  <Download className="w-4 h-4 mr-2" style={{ color: "#1F6FEB" }} />
                )}
                {downloadLoading ? "Preparing your data…" : "Download My Data"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                style={{ borderColor: "#E6ECF5" }}
                onClick={() => setActiveModal("2fa")}
              >
                <Shield className="w-4 h-4 mr-2" style={{ color: "#1F6FEB" }} />
                Two-Factor Authentication
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { setDeleteStep(1); setDeleteConfirmEmail(""); setDeleteError(""); setActiveModal("delete"); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* App Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="p-6 text-center">
            <p className="text-sm" style={{ color: "#7A869A" }}>Student Dashboard v1.0.0</p>
            <p className="text-xs mt-2" style={{ color: "#7A869A" }}>
              © 2024 Student Portal. All rights reserved.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button className="text-sm" style={{ color: "#1F6FEB" }} onClick={() => setActiveModal("terms")}>
                Terms of Service
              </button>
              <span style={{ color: "#E6ECF5" }}>|</span>
              <button className="text-sm" style={{ color: "#1F6FEB" }} onClick={() => setActiveModal("privacyPolicy")}>
                Privacy Policy
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              {/* ── 2FA Modal (Fix 5) ─────────────────────────────────────────── */}
              {activeModal === "2fa" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#1A1A1A" }}>
                    Two-Factor Authentication
                  </h2>
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Two-factor authentication will be available in a future update. Your account is currently secured by your password.
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setActiveModal(null)}>Close</Button>
                </>
              )}

              {/* ── Change Password Modal (Fix 3) ─────────────────────────────── */}
              {activeModal === "password" && (
                <>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A" }}>Change Password</h2>
                  <p className="text-sm text-gray-500 mb-5">Enter your current password to set a new one.</p>

                  {pwSuccess ? (
                    <div className="flex flex-col items-center py-6">
                      <CheckCircle className="w-14 h-14 text-green-500 mb-3" />
                      <p className="font-bold text-green-700">Password updated!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={pwForm.current}
                          onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                          className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                          style={{ borderColor: "#E6ECF5" }}
                        />
                        <input
                          type="password"
                          placeholder="New Password (min 6 characters)"
                          value={pwForm.newPw}
                          onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                          className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                          style={{ borderColor: "#E6ECF5" }}
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={pwForm.confirm}
                          onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                          style={{ borderColor: "#E6ECF5" }}
                        />
                      </div>
                      {pwError && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> {pwError}
                        </p>
                      )}
                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          onClick={handleChangePassword}
                          disabled={pwLoading}
                          style={{ background: "#1F6FEB" }}
                        >
                          {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {pwLoading ? "Saving…" : "Save Changes"}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Privacy Modal (Fix 6) ──────────────────────────────────────── */}
              {activeModal === "privacy" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Privacy Settings</h2>
                  <div className="space-y-5 mb-6">
                    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#E6ECF5" }}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Profile Visibility</p>
                        <p className="text-xs text-gray-500 mt-0.5">Who can see your profile</p>
                      </div>
                      <select
                        value={privacySettings.profileVisibility}
                        onChange={e =>
                          updateSettings({ privacy: { ...privacySettings, profileVisibility: e.target.value } })
                        }
                        className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        style={{ borderColor: "#E6ECF5" }}
                      >
                        <option value="Public">Public</option>
                        <option value="School Only">School Only</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#E6ECF5" }}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Show Activity Status</p>
                        <p className="text-xs text-gray-500 mt-0.5">Let others see when you're active</p>
                      </div>
                      <ToggleSwitch
                        checked={privacySettings.showActivityStatus}
                        onChange={() =>
                          updateSettings({ privacy: { ...privacySettings, showActivityStatus: !privacySettings.showActivityStatus } })
                        }
                      />
                    </div>
                  </div>
                  <Button className="w-full" style={{ background: "#1F6FEB" }} onClick={() => setActiveModal(null)}>
                    Done
                  </Button>
                </>
              )}

              {/* ── Delete Account Modal (Fix 4) ───────────────────────────────── */}
              {activeModal === "delete" && (
                <>
                  <h2 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Delete Account
                  </h2>

                  {deleteStep === 1 ? (
                    <>
                      <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                        This will <strong>permanently delete</strong> your account and all your data — homework progress,
                        quiz results, settings, and timeline. <strong>This cannot be undone.</strong>
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700 space-y-1">
                        <p>✗ All quiz results will be deleted</p>
                        <p>✗ All homework progress will be lost</p>
                        <p>✗ Your profile will be removed</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteStep(2)}
                        >
                          I understand, continue
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700 text-sm mb-4">
                        To confirm, type your email address below:
                      </p>
                      <input
                        type="email"
                        placeholder="Your email address"
                        value={deleteConfirmEmail}
                        onChange={e => setDeleteConfirmEmail(e.target.value)}
                        className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-300 mb-3"
                        style={{ borderColor: "#fca5a5" }}
                      />
                      {deleteError && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> {deleteError}
                        </p>
                      )}
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {deleteLoading ? "Deleting…" : "Delete My Account"}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Terms of Service ──────────────────────────────────────────── */}
              {activeModal === "terms" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Terms of Service</h2>
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

              {/* ── Privacy Policy ────────────────────────────────────────────── */}
              {activeModal === "privacyPolicy" && (
                <>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Privacy Policy</h2>
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
