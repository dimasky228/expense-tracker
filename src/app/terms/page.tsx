import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ExpenseAI",
  description: "Terms and conditions for using ExpenseAI.",
};

const LAST_UPDATED = "April 30, 2026";
const CONTACT_EMAIL = "legal@expenseai.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-xl font-bold text-zinc-50">
            Expense<span className="text-cyan-400">AI</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-zinc-50 sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-zinc-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-zinc-300">
          <Section title="The short version">
            <p>
              ExpenseAI is a personal finance tool. You use it to track your own expenses. The AI
              categorization is helpful but not perfect — don&apos;t rely on it for financial
              decisions. Be respectful, don&apos;t abuse the service, and you&apos;re welcome here.
            </p>
          </Section>

          <Section title="1. About the service">
            <p>
              ExpenseAI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the service&rdquo;) is an
              AI-powered expense tracking application. It lets you import bank statements via CSV,
              automatically categorize transactions using AI, and view insights about your spending.
            </p>
            <p>
              By creating an account or using the service, you agree to these terms. If you
              don&apos;t agree, don&apos;t use the service.
            </p>
          </Section>

          <Section title="2. Account responsibilities">
            <ul>
              <li>You must be at least 16 years old to use ExpenseAI</li>
              <li>
                You are responsible for keeping your password secure. Don&apos;t share your account
                with others
              </li>
              <li>
                You are responsible for all activity that happens under your account
              </li>
              <li>
                If you suspect unauthorized access, change your password immediately and contact us
              </li>
              <li>
                You agree to provide accurate information when creating your account
              </li>
            </ul>
          </Section>

          <Section title="3. Acceptable use">
            <p>You may use ExpenseAI to track your own personal or business expenses. You may not:</p>
            <ul>
              <li>Upload data you don&apos;t have the right to use</li>
              <li>
                Attempt to reverse-engineer, scrape, or overload the service
              </li>
              <li>Use the service for any unlawful purpose</li>
              <li>
                Share access with others in a way that circumvents subscription limits
              </li>
              <li>
                Use automated scripts to mass-import or mass-create transactions (beyond normal use)
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these rules.
            </p>
          </Section>

          <Section title="4. Free tier and Pro subscription">
            <p>
              <strong className="text-zinc-200">Free tier</strong> includes access to basic
              expense tracking, transaction list, and limited CSV imports (3 per month).
            </p>
            <p>
              <strong className="text-zinc-200">Pro subscription</strong> unlocks unlimited CSV
              imports, PDF export, and AI-powered weekly insights. Pro is billed monthly.
            </p>
            <p>
              <strong className="text-zinc-200">Cancellation</strong> — you can cancel your Pro
              subscription at any time. Access continues until the end of the current billing period.
              We do not offer prorated refunds for partial months.
            </p>
            <p>
              <strong className="text-zinc-200">Refunds</strong> — if you were charged in error or
              have a billing issue, contact us within 7 days at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
                {CONTACT_EMAIL}
              </a>{" "}
              and we&apos;ll make it right.
            </p>
            <p>
              We may change pricing in the future. We&apos;ll give you at least 30 days notice
              before any price increase takes effect.
            </p>
          </Section>

          <Section title="5. AI disclaimer">
            <p>
              ExpenseAI uses AI (Anthropic&apos;s Claude) to categorize transactions and generate
              spending insights. Please be aware:
            </p>
            <ul>
              <li>
                <strong className="text-zinc-200">AI categorization is not 100% accurate.</strong>{" "}
                Always review and correct categories in the app.
              </li>
              <li>
                <strong className="text-zinc-200">
                  Insights are not financial advice.
                </strong>{" "}
                The AI summaries and patterns we surface are informational only. They are not
                investment advice, tax advice, or any other professional financial guidance.
              </li>
              <li>
                Consult a qualified financial professional for decisions that matter.
              </li>
            </ul>
          </Section>

          <Section title="6. Your data">
            <p>
              You own your data. We don&apos;t claim any rights to your transaction data, categories,
              or notes. See our{" "}
              <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">
                Privacy Policy
              </Link>{" "}
              for full details on how we handle your data.
            </p>
            <p>
              When you delete your account, all your data is permanently deleted from our systems.
            </p>
          </Section>

          <Section title="7. Intellectual property">
            <p>
              The ExpenseAI name, logo, application design, and code are our intellectual property.
              You may not reproduce, distribute, or create derivative works from them without our
              written permission.
            </p>
          </Section>

          <Section title="8. Availability and modifications">
            <p>
              We try to keep ExpenseAI running reliably, but we don&apos;t guarantee 100% uptime.
              We may perform maintenance, add or remove features, or temporarily suspend the service.
            </p>
            <p>
              We may modify or discontinue features at any time. For Pro subscribers, if we remove a
              core feature, we will provide a prorated refund.
            </p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>
              To the maximum extent permitted by law, ExpenseAI is provided &ldquo;as is&rdquo; without
              warranties of any kind. We are not liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of data or financial losses arising
              from your use of the service.
            </p>
            <p>
              Our total liability to you for any claim arising from use of the service will not
              exceed the amount you paid us in the 12 months prior to the claim.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              You can stop using ExpenseAI at any time. You can delete your account in Settings →
              Danger Zone.
            </p>
            <p>
              We may suspend or terminate your account if you violate these terms, abuse the service,
              or if required by law. We&apos;ll try to give you advance notice unless the situation
              requires immediate action (e.g., fraud or abuse).
            </p>
          </Section>

          <Section title="11. Changes to these terms">
            <p>
              We may update these terms from time to time. We&apos;ll notify you of material changes
              by email or via an in-app notice at least 14 days before they take effect.
            </p>
            <p>
              Continued use of the service after the effective date means you accept the updated
              terms.
            </p>
          </Section>

          <Section title="12. Governing law">
            <p>
              These terms are governed by the laws of the jurisdiction in which ExpenseAI operates.
              Any disputes will be resolved through binding arbitration or in the courts of that
              jurisdiction.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms? Email us at{" "}
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
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy →
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
