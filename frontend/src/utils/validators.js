export function validateNonEmptyText(value, fieldName = 'Field') {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return `${fieldName} is required.`;
  }
  return null;
}

export function validatePositiveNumber(value, fieldName = 'Value') {
  const num = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(num) || num <= 0) {
    return `${fieldName} must be a valid positive number.`;
  }
  return null;
}

export function validateEmail(email) {
  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (!trimmed) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validateShippingForm(form) {
  const errors = {};

  const fullNameErr = validateNonEmptyText(form.fullName, 'Full name');
  if (fullNameErr) errors.fullName = fullNameErr;

  const emailErr = validateEmail(form.email);
  if (emailErr) errors.email = emailErr;

  const addressErr = validateNonEmptyText(form.addressLine1, 'Street address');
  if (addressErr) errors.addressLine1 = addressErr;

  const cityErr = validateNonEmptyText(form.city, 'City');
  if (cityErr) errors.city = cityErr;

  const postalErr = validateNonEmptyText(form.postalCode, 'Postal code');
  if (postalErr) errors.postalCode = postalErr;

  const countryErr = validateNonEmptyText(form.countryCode, 'Destination country');
  if (countryErr) errors.countryCode = countryErr;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePassword(password, { requireComplexity = true } = {}) {
  const value = typeof password === 'string' ? password : '';
  if (!value) return 'Password is required.';
  if (requireComplexity) {
    if (value.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return 'Password must contain at least one letter and one number.';
    }
  }
  return null;
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
}

export function validateLoginForm(form) {
  const errors = {};
  const emailErr = validateEmail(form?.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(form?.password, { requireComplexity: false });
  if (passErr) errors.password = passErr;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterForm(form) {
  const errors = {};
  const nameErr = validateNonEmptyText(form?.fullName, 'Full name');
  if (nameErr) errors.fullName = nameErr;

  const emailErr = validateEmail(form?.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(form?.password, { requireComplexity: true });
  if (passErr) errors.password = passErr;

  const confirmErr = validateConfirmPassword(form?.password, form?.confirmPassword);
  if (confirmErr) errors.confirmPassword = confirmErr;

  const countryErr = validateNonEmptyText(form?.residenceCountry, 'Residence country');
  if (countryErr) errors.residenceCountry = countryErr;

  const currencyErr = validateNonEmptyText(form?.preferredCurrency, 'Preferred currency');
  if (currencyErr) errors.preferredCurrency = currencyErr;

  if (!form?.acceptTerms) {
    errors.acceptTerms = 'Please accept the Terms of Service and order disclosures.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
