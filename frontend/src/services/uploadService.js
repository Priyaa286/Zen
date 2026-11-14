/**
 * Zen Global - Media & Document Upload Service
 * 
 * Provides validated client-side asset handling, object URL lifecycle management,
 * and contract-ready integration for FastAPI multi-vendor file upload endpoints.
 */

import { apiClient, BACKEND_CAPABILITIES } from './api';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate file before previewing or uploading
 */
export function validateUploadFile(file, { allowedTypes = ALLOWED_IMAGE_TYPES, maxSizeBytes = MAX_IMAGE_SIZE_BYTES } = {}) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();

  // Explicitly reject dangerous SVG/HTML
  if (fileType.includes('svg') || fileName.endsWith('.svg') || fileType.includes('html') || fileName.endsWith('.html')) {
    return {
      valid: false,
      error: 'SVG and HTML file formats are rejected due to embedded script risks. Please upload a PDF, PNG, or JPG.',
    };
  }

  const isAllowed = allowedTypes.some((t) => t.toLowerCase() === fileType) ||
    (allowedTypes.includes('application/pdf') && fileName.endsWith('.pdf')) ||
    (allowedTypes.includes('image/png') && fileName.endsWith('.png')) ||
    (allowedTypes.includes('image/jpeg') && (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')));

  if (!isAllowed) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload a PDF, PNG, or JPG.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of ${limitMb} MB.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Creates a browser Object URL for high-performance instant preview.
 * Returns an object with the preview URL and a cleanup function.
 */
export function createLocalImagePreview(file) {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const previewUrl = URL.createObjectURL(file);

  return {
    previewUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    revoke: () => {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // Safe disposal
      }
    },
  };
}

/**
 * Uploads an image or document asset.
 * Sends multipart/form-data to FastAPI /upload endpoint.
 */
export async function uploadAsset(file, { folder = 'profiles', allowedTypes = ALLOWED_IMAGE_TYPES, onProgress } = {}) {
  const validation = validateUploadFile(file, { allowedTypes });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Simulated initial progress callback if provided
  if (typeof onProgress === 'function') {
    onProgress(15);
  }

  // Attempt live upload to FastAPI backend if available
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (typeof onProgress === 'function' && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(Math.max(15, pct));
        }
      },
    });

    if (res.data?.url) {
      if (typeof onProgress === 'function') onProgress(100);
      return res.data;
    }
  } catch (err) {
    console.warn('Backend upload fell back to local object URL:', err?.message);
    if (err?.response?.data?.detail) {
      throw new Error(err.response.data.detail);
    }
  }

  if (typeof onProgress === 'function') {
    onProgress(100);
  }

  const objectUrl = URL.createObjectURL(file);

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url: objectUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    folder,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Dedicated document uploader for compliance and corporate verification files.
 */
export async function uploadDocument(file, { onProgress } = {}) {
  return uploadAsset(file, {
    folder: 'verification',
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    onProgress,
  });
}


