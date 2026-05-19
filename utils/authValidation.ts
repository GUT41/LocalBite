export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must contain at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  return null;
}

export function validateSignupForm(values: SignupFormValues): string | null {
  const fn = values.firstName.trim();
  const ln = values.lastName.trim();
  const em = values.email.trim();

  if (!fn || !ln) {
    return 'Please enter your first and last name.';
  }
  if (!em) {
    return 'Please enter your email.';
  }
  if (!isValidEmail(em)) {
    return 'Please enter a valid email.';
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) return passwordError;

  if (values.password !== values.confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}
