import gitImg from "../img/footer/github.png";
import FooterWidgets from "./FooterWidgets";

export default function Footer() {
  return (
    <footer className="mt-32 flex flex-col gap-10 border-t border-white/5 pt-10 pb-10">
      <FooterWidgets />
      <div className="flex items-center justify-center gap-2 font-mono text-xs text-white/40">
        <a
          href="https://github.com/rjsah5676"
          className="opacity-60 transition-opacity hover:opacity-100"
        >
          <img src={gitImg.src} alt="GitHub" className="h-4 w-auto" />
        </a>
        <span>© 2026 Gunmo Lee</span>
      </div>
    </footer>
  );
}
