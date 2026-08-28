import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="container-custom text-center">
        <p className="text-[9px] font-semibold tracking-[0.4em] uppercase text-[var(--orange-accent)] mb-4">
          404
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold text-[var(--primary-blue)] mb-4">
          Page not found
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
          That page has either moved or is not part of this site.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/events" className="btn-outline">
            See Events
          </Link>
        </div>
      </div>
    </section>
  );
}
