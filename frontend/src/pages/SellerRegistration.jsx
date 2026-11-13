import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Store,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { registerSellerStore } from '@/services/sellerService';
import { getAllCategories } from '@/data/categories';

export function SellerRegistration() {
  const { user, refreshUser } = useAuth();
  const { supportedCountries, supportedCurrencies } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const categories = getAllCategories();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    legalBusinessName: '',
    registrationNumber: '',
    businessCountry: user?.residenceCountry || 'JP',
    taxId: '',
    businessPhone: '+81 3 5555 0192',
    businessAddress: '',

    // Step 2: Store Profile
    storeName: '',
    storeSlug: '',
    originCountry: user?.residenceCountry || 'JP',
    storeCurrency: user?.preferredCurrency || 'JPY',
    primaryCategory: 'electronics',
    storeDescription: '',

    // Step 3: Verification & Settlement
    documentType: 'CERTIFICATE_OF_INCORPORATION',
    documentFileName: 'tokyo_optics_corporate_reg.pdf',
    bankName: 'Sumitomo Mitsui Banking Corporation',
    bankAccountNumber: 'SMBC-JP-9948201',
    swiftBic: 'SMBCJPJT',
    agreedToTerms: true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'storeName' && !prev.storeSlugManual) {
        next.storeSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.legalBusinessName.trim()) {
        setError('Please enter your legal business name.');
        return;
      }
      if (!formData.registrationNumber.trim()) {
        setError('Please enter your business registration number.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.storeName.trim()) {
        setError('Please enter a display store name.');
        return;
      }
      if (!formData.storeDescription.trim()) {
        setError('Please enter a brief description of your store and products.');
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.agreedToTerms) {
      setError('You must agree to the Zen Marketplace Seller Terms & 5% Platform Fee.');
      return;
    }

    setSubmitting(true);
    try {
      await registerSellerStore(
        {
          storeName: formData.storeName,
          slug: formData.storeSlug || formData.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          legalBusinessName: formData.legalBusinessName,
          registrationNumber: formData.registrationNumber,
          taxId: formData.taxId,
          businessAddress: formData.businessAddress,
          originCountry: formData.originCountry,
          currency: formData.storeCurrency,
          primaryCategory: formData.primaryCategory,
          description: formData.storeDescription,
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.bankAccountNumber,
            swiftBic: formData.swiftBic,
          },
          verificationDocuments: [
            {
              type: formData.documentType,
              fileName: formData.documentFileName,
              uploadedAt: new Date().toISOString(),
              status: 'PENDING_REVIEW',
            },
          ],
        },
        user
      );

      await refreshUser();

      showToast({
        title: 'Store application submitted!',
        description: 'Your application is now in review by the Zen Compliance team.',
        tone: 'success',
      });

      navigate('/seller/verification');
    } catch (err) {
      setError(err?.message || 'Failed to submit seller registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-12">
      <div className="zen-container max-w-3xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-[#697586]">
            <span className={step >= 1 ? 'text-[#172554]' : ''}>1. Business Info</span>
            <span className={step >= 2 ? 'text-[#172554]' : ''}>2. Store Profile</span>
            <span className={step >= 3 ? 'text-[#172554]' : ''}>3. Verification & Bank</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E7EB]">
            <div
              className="h-1.5 rounded-full bg-[#172554] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-subtle">
          <div className="border-b border-[#E5E7EB] pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#17202F]">
              Register Your Merchant Store
            </h1>
            <p className="mt-1 text-sm text-[#697586]">
              {step === 1 && 'Enter your verified legal entity and tax registration details.'}
              {step === 2 && 'Configure your international storefront name, origin country, and catalog focus.'}
              {step === 3 && 'Submit corporate verification documents and bank details for cross-border payouts.'}
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Business Details */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Legal Business / Corporate Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.legalBusinessName}
                  onChange={(e) => handleChange('legalBusinessName', e.target.value)}
                  placeholder="e.g. Tokyo Optics & Craft Co., Ltd."
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Business Registration / CR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    placeholder="e.g. 0100-01-123456"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Country of Incorporation *
                  </label>
                  <select
                    value={formData.businessCountry}
                    onChange={(e) => handleChange('businessCountry', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  >
                    {supportedCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Tax ID / VAT / GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    placeholder="e.g. T-98127391823"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Business Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.businessPhone}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Registered Corporate Address
                </label>
                <textarea
                  rows={2}
                  value={formData.businessAddress}
                  onChange={(e) => handleChange('businessAddress', e.target.value)}
                  placeholder="e.g. 4-12 Ginza, Chuo-ku, Tokyo 104-0061, Japan"
                  className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-[#1E3A8A] transition-colors"
                >
                  <span>Continue to Store Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Store Profile */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Store Display Name (Visible to Buyers Worldwide) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="e.g. Tokyo Optics & Craft"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Primary Shipping Warehouse Origin *
                  </label>
                  <select
                    value={formData.originCountry}
                    onChange={(e) => handleChange('originCountry', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  >
                    {supportedCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Store Base Settlement Currency *
                  </label>
                  <select
                    value={formData.storeCurrency}
                    onChange={(e) => handleChange('storeCurrency', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  >
                    {supportedCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.name} - {c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Primary Merchandise Category *
                </label>
                <select
                  value={formData.primaryCategory}
                  onChange={(e) => handleChange('primaryCategory', e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Store Bio & International Exporter Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  placeholder="Describe your craft, brand heritage, export authorization, and warranty policies..."
                  className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-4 text-sm font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-[#1E3A8A] transition-colors"
                >
                  <span>Verification & Bank Payout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Verification & Payout */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  <span>Zen Verified Merchant Program Requirements</span>
                </div>
                <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                  All sellers on Zen Global undergo automated and manual compliance review to prevent counterfeit listings and guarantee export authenticity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Verification Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleChange('documentType', e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                >
                  <option value="CERTIFICATE_OF_INCORPORATION">Certificate of Commercial Incorporation</option>
                  <option value="TAX_EXEMPTION_VAT">VAT / Tax Certificate</option>
                  <option value="AUTHORIZED_DISTRIBUTOR_LETTER">Authorized Brand Distributor Letter</option>
                  <option value="GOVERNMENT_ID_PASSPORT">Director Passport / National ID</option>
                </select>
              </div>

              {/* Upload Simulator */}
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Upload Official Document (PDF, PNG, JPG) *
                </label>
                <div className="mt-1.5 flex justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#F7F8FA] p-6 text-center">
                  <div className="space-y-1">
                    <UploadCloud className="mx-auto h-8 w-8 text-[#697586]" />
                    <div className="flex text-xs text-[#697586] justify-center">
                      <span className="font-semibold text-[#172554]">
                        {formData.documentFileName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#697586]">
                      Corporate seal and registry serial numbers must be clearly visible.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-[#E5E7EB] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#697586]">
                  Settlement Bank Account Details
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17202F]">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17202F]">
                      Account Number / IBAN *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17202F]">
                      SWIFT / BIC Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.swiftBic}
                      onChange={(e) => handleChange('swiftBic', e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="border-t border-[#E5E7EB] pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleChange('agreedToTerms', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#172554] focus:ring-[#172554]"
                  />
                  <span className="text-xs text-[#697586] leading-relaxed">
                    I agree to the <span className="font-semibold text-[#17202F]">Zen Marketplace Merchant Agreement</span>. I acknowledge the standard 5% platform service fee on completed orders and certify that all export documentation and listed goods meet international authenticity standards.
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-4 text-sm font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172554] px-8 text-sm font-semibold text-white shadow-subtle hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerRegistration;

