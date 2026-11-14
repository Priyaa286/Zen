import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Lock,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { getSellerStoreMe, registerSellerStore } from '@/services/sellerService';
import { uploadDocument, validateUploadFile, ALLOWED_DOCUMENT_TYPES } from '@/services/uploadService';
import { getAllCategories } from '@/data/categories';

// Document categories tailored by merchant jurisdiction
const DOCUMENT_OPTIONS_BY_COUNTRY = {
  JP: [
    { value: 'CERTIFICATE_OF_COMMERCIAL_REGISTRATION', label: 'Certificate of Commercial Registration (履歴事項全部証明書)' },
    { value: 'CORPORATE_TAX_CERTIFICATE', label: 'Corporate Tax Filing Certificate (法人税確定申告書控)' },
    { value: 'EXPORT_AUTHORIZATION_LICENSE', label: 'Export Authorization / Trade License' },
    { value: 'DIRECTOR_NATIONAL_ID', label: 'Representative Director Passport / National ID' },
  ],
  US: [
    { value: 'ARTICLES_OF_INCORPORATION', label: 'Certificate of Incorporation / Articles of Organization' },
    { value: 'IRS_EIN_LETTER', label: 'IRS Form W-9 / EIN Confirmation Letter (CP 575 / 147C)' },
    { value: 'STATE_BUSINESS_LICENSE', label: 'State Business License / Certificate of Good Standing' },
    { value: 'OFFICER_GOVERNMENT_ID', label: 'Corporate Officer Government Photo ID' },
  ],
  GB: [
    { value: 'COMPANIES_HOUSE_CERTIFICATE', label: 'Companies House Certificate of Incorporation' },
    { value: 'VAT_REGISTRATION_CERTIFICATE', label: 'HMRC VAT Registration Certificate' },
    { value: 'DIRECTOR_PASSPORT', label: 'Director Identity Document / Passport' },
  ],
  DE: [
    { value: 'COMMERCIAL_REGISTER_EXTRACT', label: 'Handelsregisterauszug (Commercial Register Extract)' },
    { value: 'EU_VAT_CERTIFICATE', label: 'Umsatzsteuer-Identifikationsnummer (USt-IdNr.) Certificate' },
    { value: 'DIRECTOR_NATIONAL_ID', label: 'Managing Director Passport / National ID' },
  ],
  FR: [
    { value: 'COMMERCIAL_REGISTER_EXTRACT', label: 'Extrait Kbis (Registre du Commerce et des Sociétés)' },
    { value: 'EU_VAT_CERTIFICATE', label: 'Certificat d’Immatriculation TVA' },
    { value: 'DIRECTOR_NATIONAL_ID', label: 'Représentant Légal Passport / National ID' },
  ],
  DEFAULT: [
    { value: 'CERTIFICATE_OF_INCORPORATION', label: 'Certificate of Commercial Incorporation' },
    { value: 'TAX_REGISTRATION_CERTIFICATE', label: 'National Tax / VAT / GST Certificate' },
    { value: 'BUSINESS_TRADE_LICENSE', label: 'Official Business / Export Trade License' },
    { value: 'GOVERNMENT_ID_PASSPORT', label: 'Director Passport / Government Photo ID' },
  ],
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SellerRegistration() {
  const { user, refreshUser } = useAuth();
  const { supportedCountries, supportedCurrencies } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = getAllCategories();

  // Clean-slate form state with zero fake hardcoded values
  const [formData, setFormData] = useState({
    // Step 1: Legal Entity
    legalBusinessName: '',
    registrationNumber: '',
    businessCountry: user?.residenceCountry || 'JP',
    taxId: '',
    businessPhone: '',
    businessAddress: '',

    // Step 2: Store Profile
    storeName: '',
    storeSlug: '',
    storeSlugManual: false,
    originCountry: user?.residenceCountry || 'JP',
    storeCurrency: user?.preferredCurrency || 'JPY',
    primaryCategory: 'electronics',
    storeDescription: '',

    // Step 3: Document Verification & Bank Details
    documentType: 'CERTIFICATE_OF_INCORPORATION',
    documentFile: null,
    documentFileName: '',
    documentUrl: '',
    documentFileSize: null,

    // Settlement Bank Information
    bankCountry: user?.residenceCountry || 'JP',
    settlementCurrency: user?.preferredCurrency || 'JPY',
    bankName: '',
    accountHolderName: '',
    bankAccountNumber: '',
    routingNumber: '',
    sortCode: '',
    swiftBic: '',

    // Merchant Agreement
    agreedToTerms: false,
  });

  // Pre-load saved data ONLY if the authenticated user already owns an existing registration
  useEffect(() => {
    let isMounted = true;
    async function loadExistingStore() {
      if (!user?.email) return;
      try {
        const store = await getSellerStoreMe(user.email);
        if (store && isMounted) {
          setFormData((prev) => ({
            ...prev,
            legalBusinessName: store.legalBusinessName || store.legal_business_name || '',
            registrationNumber: store.registrationNumber || store.registration_number || store.businessRegistration || '',
            businessCountry: store.country || prev.businessCountry,
            taxId: store.taxId || store.tax_id || '',
            businessPhone: store.businessPhone || store.business_phone || '',
            businessAddress: store.businessAddress || store.business_address || '',
            storeName: store.storeName || store.store_name || '',
            storeSlug: store.slug || '',
            originCountry: store.country || prev.originCountry,
            storeCurrency: store.baseCurrency || store.base_currency || prev.storeCurrency,
            primaryCategory: store.primaryCategory || store.primary_category || prev.primaryCategory,
            storeDescription: store.description || '',
            bankName: store.bankName || '',
            accountHolderName: store.bankAccountHolder || '',
            bankAccountNumber: store.bankAccountMasked || '',
            swiftBic: store.swiftBic || '',
            bankCountry: store.bankCountry || store.country || prev.bankCountry,
            settlementCurrency: store.settlementCurrency || store.base_currency || prev.settlementCurrency,
            documentFileName: store.verificationDocuments?.[0]?.fileName || '',
            documentUrl: store.verificationDocuments?.[0]?.fileUrl || '',
            documentFileSize: store.verificationDocuments?.[0]?.fileSize || null,
          }));
        }
      } catch {
        // No existing store found: keep clean-slate defaults
      }
    }
    loadExistingStore();
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  const docOptions =
    DOCUMENT_OPTIONS_BY_COUNTRY[formData.businessCountry] || DOCUMENT_OPTIONS_BY_COUNTRY.DEFAULT;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'storeName' && !prev.storeSlugManual) {
        next.storeSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      if (field === 'businessCountry') {
        next.originCountry = value;
        next.bankCountry = value;
        const availableTypes = DOCUMENT_OPTIONS_BY_COUNTRY[value] || DOCUMENT_OPTIONS_BY_COUNTRY.DEFAULT;
        next.documentType = availableTypes[0].value;
      }
      if (field === 'storeCurrency') {
        next.settlementCurrency = value;
      }
      return next;
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateUploadFile(file, {
      allowedTypes: ALLOWED_DOCUMENT_TYPES,
      maxSizeBytes: 5 * 1024 * 1024,
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const result = await uploadDocument(file, {
        onProgress: (pct) => setUploadProgress(pct),
      });

      setFormData((prev) => ({
        ...prev,
        documentFile: file,
        documentFileName: file.name,
        documentUrl: result.url,
        documentFileSize: file.size,
      }));

      showToast({
        title: 'Document uploaded successfully',
        description: `${file.name} (${formatBytes(file.size)}) ready for compliance review.`,
        tone: 'success',
      });
    } catch (err) {
      setError(err?.message || 'Failed to upload document. Please ensure it is a valid PDF, PNG, or JPG under 5 MB.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documentFile: null,
      documentFileName: '',
      documentUrl: '',
      documentFileSize: null,
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.legalBusinessName.trim()) {
        setError('Please enter your registered legal business name.');
        return;
      }
      if (!formData.registrationNumber.trim()) {
        setError('Please enter your business registration or incorporation number.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.storeName.trim()) {
        setError('Please enter a storefront display name.');
        return;
      }
      if (!formData.storeDescription.trim()) {
        setError('Please provide a brief merchant biography and export focus.');
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.documentFileName && !formData.documentUrl) {
      setError('Please select and upload a valid corporate verification document (PDF, PNG, or JPG).');
      return;
    }

    if (!formData.bankName.trim()) {
      setError('Please provide your settlement bank name.');
      return;
    }

    if (!formData.bankAccountNumber.trim()) {
      setError('Please provide your bank account number or IBAN.');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('You must review and accept the Zen Marketplace Merchant Agreement and 5% Platform Fee.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeName: formData.storeName.trim(),
        slug: formData.storeSlug || formData.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        legalBusinessName: formData.legalBusinessName.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        taxId: formData.taxId.trim(),
        businessPhone: formData.businessPhone.trim(),
        businessAddress: formData.businessAddress.trim(),
        country: formData.businessCountry,
        originCountry: formData.originCountry,
        baseCurrency: formData.storeCurrency,
        primaryCategory: formData.primaryCategory,
        description: formData.storeDescription.trim(),
        bankDetails: {
          bankName: formData.bankName.trim(),
          accountHolderName: formData.accountHolderName.trim() || formData.legalBusinessName.trim(),
          accountNumber: formData.bankAccountNumber.trim(),
          swiftBic: formData.swiftBic.trim(),
          routingNumber: formData.routingNumber.trim(),
          sortCode: formData.sortCode.trim(),
          bankCountry: formData.bankCountry,
          settlementCurrency: formData.settlementCurrency,
        },
        verificationDocuments: [
          {
            type: formData.documentType,
            fileName: formData.documentFileName,
            fileUrl: formData.documentUrl,
            fileSize: formData.documentFileSize,
            uploadedAt: new Date().toISOString(),
            status: 'PENDING_REVIEW',
          },
        ],
        agreementAccepted: true,
        agreementVersion: 'v1.2-2026',
      };

      await registerSellerStore(payload, user);
      await refreshUser();

      showToast({
        title: 'Application Submitted for Review',
        description: 'Your merchant profile and documents have been sent to the Zen Compliance team.',
        tone: 'success',
      });

      navigate('/seller/verification');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to submit merchant registration. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-10">
      <div className="zen-container max-w-3xl">
        {/* Step Indicator Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#697586]">
            <span className={step >= 1 ? 'text-[#172554] font-bold' : ''}>1. Legal Entity</span>
            <span className={step >= 2 ? 'text-[#172554] font-bold' : ''}>2. Storefront Profile</span>
            <span className={step >= 3 ? 'text-[#172554] font-bold' : ''}>3. Documents & Settlement</span>
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
          <div className="border-b border-[#E5E7EB] pb-5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17202F]">
              Merchant Onboarding & Verification
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#697586]">
              {step === 1 && 'Enter your registered corporate entity, tax identification, and registered address.'}
              {step === 2 && 'Configure your international storefront name, origin hub, and catalog category.'}
              {step === 3 && 'Submit commercial documentation and settlement account details for cross-border payouts.'}
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Legal Entity Information */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Legal Business / Corporate Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.legalBusinessName}
                  onChange={(e) => handleChange('legalBusinessName', e.target.value)}
                  placeholder="Official entity name matching incorporation filings"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Business Registration / CR Number <span className="text-red-500">*</span>
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
                    Country of Incorporation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.businessCountry}
                    onChange={(e) => handleChange('businessCountry', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
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
                    Tax Identification / VAT / GSTIN Number
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
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    placeholder="e.g. +81 3 0000 0000"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Registered Corporate Headquarters Address
                </label>
                <textarea
                  rows={2}
                  value={formData.businessAddress}
                  onChange={(e) => handleChange('businessAddress', e.target.value)}
                  placeholder="Street address, city, state/prefecture, postal code"
                  className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
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

          {/* STEP 2: Storefront Profile */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Storefront Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="Store name shown to international buyers"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#17202F]">
                    Primary Dispatch & Warehouse Origin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.originCountry}
                    onChange={(e) => handleChange('originCountry', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
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
                    Catalog Base Settlement Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.storeCurrency}
                    onChange={(e) => handleChange('storeCurrency', e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
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
                  Primary Merchandise Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.primaryCategory}
                  onChange={(e) => handleChange('primaryCategory', e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
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
                  Merchant Summary & Export Warranty <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  placeholder="Describe your brand heritage, export compliance, packaging authenticity, and warranty support..."
                  className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E5E7EB]">
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
                  <span>Verification & Settlement</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Verification Documents & Settlement Details */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Document Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Verification Document Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleChange('documentType', e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
                >
                  {docOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#697586]">
                  Tailored to your selected incorporation country ({formData.businessCountry}).
                </p>
              </div>

              {/* Genuine Local File Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-[#17202F]">
                  Upload Official Corporate Document (PDF, PNG, JPG) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!formData.documentFileName ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-7 text-center transition-all hover:border-[#172554] hover:bg-slate-50"
                  >
                    <UploadCloud className="h-9 w-9 text-[#64748B]" />
                    <p className="mt-2 text-xs font-semibold text-[#17202F]">
                      {uploading ? 'Validating and uploading document...' : 'Click to select local verification document'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      PDF, PNG, or JPG up to 5 MB. Serial numbers and official registry seals must be legible.
                    </p>

                    {uploading && (
                      <div className="mt-4 w-48">
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-[#172554] transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="mt-1 block text-[10px] text-slate-500 font-medium">
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[#CBD5E1] bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileCheck2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-[#17202F]">
                            {formData.documentFileName}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <Check className="h-3 w-3" /> Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {formatBytes(formData.documentFileSize)} · Encrypted storage
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Replace</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Settlement Bank Details Section */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202F]">
                      Settlement Bank Account
                    </h3>
                    <p className="text-[11px] text-[#697586] mt-0.5">
                      Destination account for weekly automated sales settlements.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                    <Lock className="h-3 w-3" />
                    <span>AES-256 Encrypted</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#17202F]">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      placeholder="e.g. Mizuho Bank / Chase / Barclays"
                      className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202F]">
                      Account Holder Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.accountHolderName || formData.legalBusinessName}
                      onChange={(e) => handleChange('accountHolderName', e.target.value)}
                      placeholder="Must match corporate registration"
                      className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Country-Specific Banking Fields */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {formData.businessCountry === 'US' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">
                          ABA Routing Number (9 Digits) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={9}
                          value={formData.routingNumber}
                          onChange={(e) => handleChange('routingNumber', e.target.value)}
                          placeholder="e.g. 021000021"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.bankAccountNumber}
                          onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                          placeholder="Checking account number"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">SWIFT / BIC</label>
                        <input
                          type="text"
                          value={formData.swiftBic}
                          onChange={(e) => handleChange('swiftBic', e.target.value.toUpperCase())}
                          placeholder="Optional for domestic ACH"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                    </>
                  ) : formData.businessCountry === 'GB' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">
                          UK Sort Code (6 Digits) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.sortCode}
                          onChange={(e) => handleChange('sortCode', e.target.value)}
                          placeholder="e.g. 20-00-00"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">
                          Account Number (8 Digits) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.bankAccountNumber}
                          onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                          placeholder="e.g. 12345678"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">SWIFT / BIC</label>
                        <input
                          type="text"
                          value={formData.swiftBic}
                          onChange={(e) => handleChange('swiftBic', e.target.value.toUpperCase())}
                          placeholder="e.g. BARCGB22"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#17202F]">
                          Account Number / IBAN <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.bankAccountNumber}
                          onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                          placeholder="Domestic account number or international IBAN"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#17202F]">
                          SWIFT / BIC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.swiftBic}
                          onChange={(e) => handleChange('swiftBic', e.target.value.toUpperCase())}
                          placeholder="e.g. SMBCJPJT"
                          className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-xs text-[#17202F] focus:border-[#172554] focus:outline-none bg-white font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                <p className="mt-3 text-[11px] text-[#697586] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#172554]" />
                  <span>Account numbers are permanently masked for display. Zen never stores online banking passwords.</span>
                </p>
              </div>

              {/* Merchant Agreement Section */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleChange('agreedToTerms', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#172554] focus:ring-[#172554]"
                  />
                  <div className="text-xs text-[#475569] leading-relaxed">
                    <span>I have reviewed and agree to the </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAgreementModal(true);
                      }}
                      className="font-semibold text-[#172554] underline hover:text-[#1E3A8A]"
                    >
                      Zen Marketplace Merchant Agreement (v1.2-2026)
                    </button>
                    <span>. I understand and accept the standard 5% platform fee on settled sales, and confirm that all listed goods and export filings comply with international customs law.</span>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t border-[#E5E7EB]">
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
                  disabled={submitting || !formData.agreedToTerms || (!formData.documentFileName && !formData.documentUrl)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172554] px-8 text-sm font-semibold text-white shadow-subtle hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Accessible Agreement Terms Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#17202F]">Zen Marketplace Merchant Agreement</h3>
                <p className="text-xs text-[#697586]">Contract Version: v1.2-2026 · Cross-Border Settlement</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="rounded-lg p-1.5 text-[#697586] hover:bg-[#F7F8FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-[#475569] leading-relaxed">
              <section>
                <h4 className="font-bold text-[#17202F]">1. Platform Service Fee</h4>
                <p className="mt-1">
                  Zen assesses a standardized platform fee of 5.0% on the net product sales volume of completed cross-border transactions. Payouts are reconciled weekly and deposited via PayPal Batch Payouts or local bank wires.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-[#17202F]">2. Export Authenticity & Anti-Counterfeit Policy</h4>
                <p className="mt-1">
                  The merchant warrants that all inventory listed on the marketplace is 100% authentic, legally acquired, and authorized for international export under origin jurisdiction regulations. Counterfeit, replica, or gray-market items result in immediate merchant expulsion and forfeiture of escrow balances.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-[#17202F]">3. Fulfillment & Tracking Requirements</h4>
                <p className="mt-1">
                  Orders must be packaged and dispatched with an active international air waybill (DHL Express, FedEx, Japan Post EMS, or UPS Worldwide) within two (2) business days of order confirmation.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-[#17202F]">4. Data Protection & Banking Security</h4>
                <p className="mt-1">
                  Settlement bank details provided are encrypted at rest using AES-256 algorithms. Zen complies with international payment industry standards and never sells or exposes merchant banking records.
                </p>
              </section>
            </div>

            <div className="mt-6 flex justify-end border-t border-[#E5E7EB] pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, agreedToTerms: true }));
                  setShowAgreementModal(false);
                }}
                className="inline-flex h-9 items-center rounded-lg bg-[#172554] px-5 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
              >
                Accept Terms & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerRegistration;
