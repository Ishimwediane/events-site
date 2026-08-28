import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { brand } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        image="/images/gallery/agaciro-edition-1/agaciro.jpg"
        height="h-[40vh] md:h-[45vh]"
      />
      <section className="section">
        <div className="container-custom max-w-3xl">
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            This page needs the policy text {brand.name} wants to publish. It has deliberately been
            left as a placeholder rather than filled with boilerplate, because a privacy policy has
            to describe what this business actually does with personal data.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            What the site collects today, for whoever writes it: the name and email given at ticket
            checkout (stored by the API in <code>tickets_ticket</code> and used to email a QR
            ticket), and the name, email, phone and message given on the contact form (emailed to{" "}
            {brand.email}, not stored).
          </p>
        </div>
      </section>
    </>
  );
}
