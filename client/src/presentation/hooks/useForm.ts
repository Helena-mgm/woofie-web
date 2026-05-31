import { useState, FormEvent, ChangeEvent } from 'react';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void> | void;
}

/**
 * Hook générique pour gérer les formulaires
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    isValid: true,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
      errors: {
        ...prev.errors,
        [name]: undefined,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    const errors = validate ? validate(state.values) : {};
    const isValid = Object.keys(errors).length === 0;

    setState((prev) => ({
      ...prev,
      errors,
      isValid,
    }));

    if (!isValid) return;

    // Submit
    setState((prev) => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(state.values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const reset = () => {
    setState({
      values: initialValues,
      errors: {},
      isSubmitting: false,
      isValid: true,
    });
  };

  const setFieldValue = <K extends keyof T>(name: K, value: T[K]) => {
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
    }));
  };

  const setFieldError = <K extends keyof T>(name: K, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: error,
      },
    }));
  };

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}
