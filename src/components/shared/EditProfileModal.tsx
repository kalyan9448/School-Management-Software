import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Save, User, Mail, Phone, MapPin, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/utils/firestoreService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailMsg, setShowEmailMsg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                  const { storage } = await import("@/services/firebase");
                  
                  // Use appropriate folder based on role, or generic 'user_photos'
                  const roleStr = user.role ? user.role + '_' : '';
                  const fileRef = ref(storage, `${roleStr}photos/${user.id}.jpg`);
                  await uploadBytes(fileRef, blob);
                  const downloadUrl = await getDownloadURL(fileRef);
                  
                  setFormData(prev => ({ ...prev, avatar: downloadUrl }));
                  
                } catch (err) {
                  console.error("Failed to upload avatar:", err);
                  alert("Failed to upload avatar. Please try again.");
                } finally {
                  setIsUploading(false);
                }
              }
            }, "image/jpeg", 0.7);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      await userService.update(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        avatar: formData.avatar
      });

      // Sync with specific role collections if necessary
      if (user.role === 'teacher') {
        try {
          const { teacherService } = await import('@/utils/centralDataService');
          const teachers = await teacherService.getAll();
          const matchedTeacher = teachers.find((t: any) => t.email?.toLowerCase() === user.email?.toLowerCase());
          if (matchedTeacher) {
            const updateData: any = { 
              name: formData.name, 
              phone: formData.phone,
              address: formData.address
            };
            if (formData.avatar) updateData.photo = formData.avatar;
            await teacherService.update(matchedTeacher.id, updateData);
          }
        } catch (e) {
          console.warn("Failed to sync teacher profile:", e);
        }
      }

      await refreshUser();
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 text-white flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-100 group-hover:border-purple-300 transition-colors bg-purple-50 flex items-center justify-center relative">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  ) : formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-purple-600">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 font-medium">Click to change photo</p>
            </div>

            <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    onClick={() => setShowEmailMsg(true)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {showEmailMsg && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Admin Permission Needed — Email can only be changed by an administrator.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEmailMsg(false)}
                      className="ml-auto text-amber-500 hover:text-amber-700 transition-colors text-xs font-bold"
                    >✕</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={isSaving || isUploading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
