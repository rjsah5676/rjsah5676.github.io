import headerBgImg from "@/img/header/header-title.png";

export default function Header() {
  return (
    <div className="header" style={{ backgroundImage: `url(${headerBgImg.src})` }}>
      <b className="header-title">Gunmo's Develop Life</b>
    </div>
  );
}
