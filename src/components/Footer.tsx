import gitImg from "../img/footer/github.png";

export default function Footer() {
  return (
    <footer className="mt-32 flex items-center justify-center gap-2 pt-10 pb-10 font-mono text-xs text-white/40">
      <a
        href="https://github.com/rjsah5676"
        className="opacity-60 transition-opacity hover:opacity-100"
      >
        <img src={gitImg.src} alt="" className="h-4 w-auto" />
      </a>
      <span>© 2026 Gunmo Lee</span>
    </footer>
  );
}
