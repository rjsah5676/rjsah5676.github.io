import gitImg from "../img/footer/github.png";

const linkStyle = {
  textDecoration: "none",
  color: "white",
};

const gitImgStyle = {
  width: "50px",
  display: "inline",
  float: "left",
  margin: "10px 0px 0px 10px",
};

export default function Footer() {
  return (
    <div className="footer">
      <a href="https://github.com/rjsah5676">
        <img src={gitImg.src} style={gitImgStyle} alt="" />
      </a>
      Copyright 2021. 이건모. All right Reserved{" "}
      <a style={linkStyle} href="#/ewfwfeff">
        .
      </a>
    </div>
  );
}
