'use client';

import Link from 'next/link';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { ArrowLeftIcon, SendIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { siteConfig } from '@/lib/site-config';

type ContactStatus = 'idle' | 'submitting';

interface ContactFormState {
  name: string;
  email: string;
  message: string;
  company: string;
}

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  message: '',
  company: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: ContactFormState): string | null {
  if (form.name.trim().length < 2) {
    return 'Enter your name.';
  }

  if (!EMAIL_PATTERN.test(form.email.trim())) {
    return 'Enter a valid email address.';
  }

  if (form.message.trim().length < 10) {
    return 'Write a message with at least 10 characters.';
  }

  return null;
}

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const validationError = useMemo(() => validateForm(form), [form]);
  const isSubmitting = status === 'submitting';

  const updateField =
    (field: keyof ContactFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setError(null);
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          company: form.company.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Unable to send message right now.');
      }

      setForm(initialFormState);
      toast.success('Message sent');
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send message right now.';
      setError(message);
      toast.error(message);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--background)] bg-grid px-4 py-6 text-[var(--text-primary)] transition-colors duration-300 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-8">
          <Link
            href="/"
            className="interactive-hover inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] focus-ring"
          >
            <ArrowLeftIcon size={16} />
            Home
          </Link>
        </div>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--orange)]">
                Contact
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Start a conversation
              </h1>
              <p className="max-w-md text-base leading-7 text-[var(--text-secondary)]">
                Send a note about robotics, embedded systems, software work, or a project
                that needs a careful builder.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Direct email
              </p>
              <a
                href={`mailto:${siteConfig.links.email}`}
                className="mt-2 inline-block break-all font-mono text-sm text-[var(--purple)] hover:text-[var(--purple-hover)]"
              >
                {siteConfig.links.email}
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-xl p-5 shadow-soft sm:p-6"
            noValidate
          >
            <div className="grid gap-5">
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField('name')}
                  required
                  minLength={2}
                  maxLength={120}
                  className="rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-muted)]"
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField('email')}
                  required
                  maxLength={254}
                  className="rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-muted)]"
                  placeholder="you@example.com"
                />
              </div>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={updateField('company')}
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-[var(--text-secondary)]"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={updateField('message')}
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={8}
                  className="resize-y rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-3 text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple-muted)]"
                  placeholder="What are you building?"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-[var(--status-error-muted)] px-4 py-3 text-sm text-[var(--status-error)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="interactive-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--orange-hover)]/20 bg-[var(--orange)] px-5 py-3 text-sm font-semibold text-[var(--text-on-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:bg-[var(--orange-hover)] enabled:hover:shadow-[0_0_20px_var(--orange-muted)] focus-ring"
              >
                <SendIcon size={18} />
                {isSubmitting ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
