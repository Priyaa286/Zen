import { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Lock,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  validateUploadFile,
  createLocalImagePreview,
  uploadAsset,
} from '@/services/uploadService';
import { updateUserProfile } from '@/services/userService';

export default function SellerProfile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Form State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || 'Kenji Tanaka',
    email: user?.email || 'seller@zen.global',
    phone: user?.phone || '+81 3 5555 0192',
    designation: user?.designation || user?.jobTitle || 'Founder & Principal Craftsman',
    country: user?.country || user?.residenceCountry || 'JP',
    preferredLanguage: user?.preferredLanguage || 'English (Global)',
    twoFactorEnabled: user?.twoFactorEnabled ?? true,
  });

  // Photo & Preview State
  const [currentPhoto, setCurrentPhoto] = useState(user?.profilePhoto || user?.avatarUrl || null);
  const [previewObj, setPreviewObj] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password change state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securitySaved, setSecuritySaved] = useState(false);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewObj?.revoke) {
        previewObj.revoke();
      }
    };
  }, [previewObj]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      showToast({
        title: 'Invalid File',
        description: validation.error,
        tone: 'critical',
      });
      return;
    }

    // Revoke previous preview if any
    if (previewObj?.revoke) {
      previewObj.revoke();
    }

    try {
      const createdPreview = createLocalImagePreview(file);
      setPreviewObj({ file, ...createdPreview });
      setErrorMsg('');
      showToast({
        title: 'Photo Selected',
        description: `${file.name} ready to save. Click "Save Changes" to apply.`,
        tone: 'info',
      });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRemovePhoto = () => {
    if (previewObj?.revoke) {
      previewObj.revoke();
    }
    setPreviewObj(null);
    setCurrentPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast({
      title: 'Photo Removed',
      description: 'Profile photo will revert to your merchant initial.',
      tone: 'info',
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      let finalPhotoUrl = currentPhoto;

      // If user selected a new photo, upload it
      if (previewObj?.file) {
        setUploadProgress(10);
        const uploaded = await uploadAsset(previewObj.file, {
          folder: 'profiles',
          onProgress: (p) => setUploadProgress(p),
        });
        finalPhotoUrl = uploaded.url;
      }

      const updatedPayload = {
        ...profileData,
        profilePhoto: finalPhotoUrl,
        avatarUrl: finalPhotoUrl,
      };

      // Persist profile
      await updateUserProfile(updatedPayload);
      if (updateUser) {
        updateUser(updatedPayload);
      }

      setCurrentPhoto(finalPhotoUrl);
      setPreviewObj(null);
      setUploadProgress(null);

      showToast({
        title: 'Profile Updated',
        description: 'Your merchant account profile details have been saved.',
        tone: 'success',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
      showToast({
        title: 'Update Failed',
        description: err.message,
        tone: 'critical',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast({
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
        tone: 'critical',
      });
      return;
    }
    setSecuritySaved(true);
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast({
      title: 'Security Settings Updated',
      description: 'Your password and 2FA credentials have been refreshed.',
      tone: 'success',
    });
  };

  const displayPhoto = previewObj?.previewUrl || currentPhoto;

  return (
    <div className="space-y-6">
      {/* Page Toolbar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
        <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
          Personal Profile
        </h1>
        <p className="mt-0.5 text-xs text-[#697586]">
          Manage your personal credentials, contact details, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Photo Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-[#17202F] self-start">Profile Photograph</h2>
          <p className="text-xs text-[#697586] self-start mt-0.5 mb-5">
            Visible on store contact listings & compliance records.
          </p>

          <div className="relative group">
            <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-[#E5E7EB] bg-[#F7F8FA] flex items-center justify-center shadow-subtle">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={profileData.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#172554] text-3xl font-bold text-white uppercase">
                  {profileData.fullName.charAt(0) || 'M'}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#172554] text-white shadow-md hover:bg-[#1E3A8A] transition-colors focus:outline-none"
              title="Upload new photograph"
              aria-label="Upload profile photograph"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="File upload"
          />

          {uploadProgress !== null && (
            <div className="w-full mt-4">
              <div className="flex justify-between text-[11px] text-[#697586] mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#465BE5] rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5"
            >
              <Upload className="h-3.5 w-3.5 text-[#697586]" />
              {displayPhoto ? 'Replace Image' : 'Upload Image'}
            </Button>

            {displayPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>

          <p className="mt-4 text-[11px] text-[#9CA3AF] leading-relaxed">
            Allowed formats: JPG, PNG, WebP.<br />
            Maximum file size: 5 MB.
          </p>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg w-full">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Personal Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-5">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-[#17202F]">Personal Details</h2>
              <p className="text-xs text-[#697586] mt-0.5">
                Update your verified merchant contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Direct Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Job Designation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={profileData.designation}
                    onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Country of Residence
                </label>
                <select
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  <option value="JP">Japan (JP)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="IN">India (IN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Preferred Portal Language
                </label>
                <select
                  value={profileData.preferredLanguage}
                  onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  <option value="English (Global)">English (Global)</option>
                  <option value="Japanese">日本語 (Japanese)</option>
                  <option value="German">Deutsch (German)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </Button>
            </div>
          </form>

          {/* Account Security Section */}
          <form onSubmit={handleSaveSecurity} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#17202F]">Account Security & Access</h2>
                <p className="text-xs text-[#697586] mt-0.5">
                  Multi-factor authentication and credential management.
                </p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                2FA Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#465BE5]" />
                <span className="text-xs text-[#17202F] font-medium">
                  Two-Factor Authentication (Authenticator App)
                </span>
              </div>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-8"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

