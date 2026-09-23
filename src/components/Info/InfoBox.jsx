"use client";

import { useState } from "react";
import Link from "next/link";

import gitImg from "@/img/Page/info/github.png";
import gitHoverImg from "@/img/Page/info/github_hover.png";
import pageOutImg from "@/img/Page/info/page_out.png";
import pageOutHoverImg from "@/img/Page/info/page_out_hover.png";

// idx별 "두번째 외부 링크"만 다르고 나머지는 100% 동일했던 6개 분기를
// secondLink 하나로 통합함 (원본: idx===1/10/4/5/11 케이스가 이 링크만 다름).
export default function InfoBox({ imgLink, gitLink, title, desc, tech, idx, secondLink }) {
  const [linkIndex, setLinkIndex] = useState(0);
  const [linkIndex2, setLinkIndex2] = useState(0);

  return (
    <div className="info-item">
      <Link
        href={`/infoPage/${idx}`}
        style={{ backgroundImage: `url(${imgLink.src})` }}
        className="info-image"
      />
      <div className="right-content">
        <Link href={`/infoPage/${idx}`} className="info-title">
          {title}
        </Link>
        <div className="info-desc">{desc}</div>
        {tech}
        <div className="info-link-test">
          <a
            href={gitLink}
            onMouseOver={() => setLinkIndex(idx)}
            onMouseOut={() => setLinkIndex(0)}
            style={{
              backgroundImage: `url(${(linkIndex === idx ? gitHoverImg : gitImg).src})`,
            }}
            className="info-link"
          >
            {" "}
          </a>
          {secondLink && (
            <a
              href={secondLink}
              onMouseOver={() => setLinkIndex2(idx)}
              onMouseOut={() => setLinkIndex2(0)}
              style={{
                backgroundImage: `url(${(linkIndex2 === idx ? pageOutHoverImg : pageOutImg).src})`,
              }}
              className="info-link"
            >
              {" "}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
