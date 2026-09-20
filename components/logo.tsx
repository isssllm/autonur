import Link from 'next/link';

export default function Logo() {
  return <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white transition-transform group-hover:rotate-3"><span className="text-lg">A</span></span><span className="text-lg">Autonur</span></Link>;
}
