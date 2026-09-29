import gitImg from "../img/footer/github.png";
import FooterWidgets from "./FooterWidgets";

export default function Footer() {
  return (
    <footer className="mt-32 flex flex-col gap-10 border-t border-white/5 pt-10 pb-10">
      <FooterWidgets />
      {/* 연락처 (헤더의 contact를 옮겨옴) */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-4 font-mono text-xs text-white/45">
        <span className="text-[#8B84FF]">contact</span>
        <a href="mailto:rjsah5676@gmail.com" className="transition-colors hover:text-white">
          rjsah5676@gmail.com
        </a>
        <a href="tel:010-6385-4676" className="transition-colors hover:text-white">
          010-6385-4676
        </a>
      </div>
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
