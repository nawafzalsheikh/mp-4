import Link from "next/link";

export default function SiteHeader() {
  return (
    <header>
      <nav aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
    </header>
  );
}
