import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ExpenseAI",
  description: "How ExpenseAI collects, uses, and protects your data.",
};

const LAST_UPDATED = "April 30, 2026";
const CONTACT_EMAIL = "privacy@expenseai.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-xl font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-zinc-50 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-zinc-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose-zinc space-y-10 text-zinc-300">
          <Section title="The short version">
            <p>
              We collect your email address and the financial data you upload. We use it to run the
              app and power the AI features. We don&apos;t sell your data, we don&apos;t connect to
              your bank accounts, and you can delete everything at any time.
            </p>
          </Section>

          <Section title="1. What we collect">
            <ul>
              <li>
                <strong className="text-zinc-100">Account information</strong> — your email address
                and password (stored as a salted hash by Supabase). If you sign in with Google, we
                receive your name and email from Google.
              </li>
              <li>
                <strong className="text-zinc-100">Transaction data</strong> — dates, amounts,
                descriptions, and categories you add manually or import via CSV. We never receive
                bank credentials or direct access to your accounts.
              </li>
              <li>
                <strong className="text-zinc-100">Usage data</strong> — which features you use, how
                many imports you&apos;ve done this month. We use this for usage limits only.
              </li>
              <li>
                <strong className="text-zinc-100">Payment information</strong> — if you subscribe to
                Pro, Stripe handles your card details. We only store your Stripe customer ID and
                subscription status — never your card number.
              </li>
            </ul>
          </Section>

          <Section title="2. How we use your data">
            <ul>
              <li>To display your transactions, summaries, and analytics in the app</li>
              <li>
                To run AI categorization and insights — your transaction descriptions are sent to
                Anthropic&apos;s Claude API for processing
              </li>
              <li>To manage your subscription and billing through Stripe</li>
              <li>To send transactional emails (password reset, account confirmation)</li>
              <li>To enforce usage limits on the free tier</li>
            </ul>
            <p>
              We do not use your financial data for advertising, profiling, or selling to third
              parties.
            </p>
          </Section>

          <Section title="3. Third-party services">
            <p>We rely on these services to operate:</p>
            <ul>
              <li>
                <strong className="text-zinc-100">Supabase</strong> (supabase.com) — database and
                authentication. Your data is stored on Supabase&apos;s servers with row-level
                security ensuring only you can access your records.
              </li>
              <li>
                <strong className="text-zinc-100">Anthropic Claude API</strong> (anthropic.com) —
                AI categorization and weekly insights. Transaction descriptions are sent to their API.
                Anthropic&apos;s privacy policy applies to this processing.
              </li>
              <li>
                <strong className="text-zinc-100">Stripe</strong> (stripe.com) — payment processing
                for Pro subscriptions. Stripe is PCI DSS compliant. We never see your card number.
              </li>
              <li>
                <strong className="text-zinc-100">Vercel</strong> (vercel.com) — hosting and
                deployment. Vercel may log request metadata (IP, user agent) for security purposes.
              </li>
            </ul>
          </Section>

          <Section title="4. Data security">
            <ul>
              <li>All data is encrypted in transit using TLS/HTTPS</li>
              <li>
                Row-level security (RLS) in our database means your data is isolated from other
                users at the database level — not just at the application level
              </li>
              <li>We don&apos;t store your bank account credentials or access tokens</li>
              <li>Passwords are never stored in plain text</li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <p>
              We keep your data as long as your account is active. When you delete your account
              (via Settings → Danger Zone → Delete Account), we permanently delete all your
              transactions, settings, and account information from our systems.
            </p>
            <p>
              Stripe may retain payment records for legal and accounting purposes as required by
              applicable law.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong className="text-zinc-100">Access your data</strong> — all your transactions
                are visible in the app and can be exported
              </li>
              <li>
                <strong className="text-zinc-100">Export your data</strong> — Pro users can export a
                PDF report; all users can see their full transaction history in the app
              </li>
              <li>
                <strong className="text-zinc-100">Delete your data</strong> — use Settings →
                Delete Account to permanently remove all your data
              </li>
              <li>
                <strong className="text-zinc-100">Correct your data</strong> — you can edit any
                transaction directly in the app
              </li>
            </ul>
            <p>
              For requests not covered by the app&apos;s built-in tools, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use a single session cookie to keep you logged in. We do not use tracking cookies,
              advertising cookies, or analytics cookies. The session cookie is deleted when you sign
              out.
            </p>
            <p>
              We also store a locale preference (language choice) in a cookie to remember your
              language setting.
            </p>
          </Section>

          <Section title="8. GDPR (for EU users)">
            <p>
              If you are in the European Economic Area, you have additional rights under GDPR,
              including the right to data portability and the right to lodge a complaint with your
              local supervisory authority.
            </p>
            <p>
              Our legal basis for processing your data is contract performance (to provide the
              service you signed up for) and legitimate interests (security, fraud prevention).
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              ExpenseAI is not intended for users under 16. We do not knowingly collect data from
              children. If you believe a child has created an account, please contact us and we will
              delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              If we make material changes to this policy, we will notify you by email or by showing
              a notice in the app before the change takes effect. Continued use of the app after
              the effective date constitutes acceptance.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex items-center justify-between border-t border-zinc-800 pt-8 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            ← Back to home
          </Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400 [&_a]:text-cyan-400 [&_a]:hover:text-cyan-300 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-zinc-200 [&_ul]:mt-3 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
