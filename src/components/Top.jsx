"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDraggableContactModal, openContactModal } from "../hooks/useDraggableContactModal";

const baseStyle = {
  color: "#444444",
  padding: "16px",
  borderWidth: "0px 0px 0px 0px",
  borderStyle: "solid",
  fontWeight: "400",
};

const activeStyle = {
  ...baseStyle,
  borderWidth: "0px 0px 4px 0px",
  fontWeight: "800",
};

const archiveLinkStyle = { textDecoration: "none" };

export default function Top() {
  const pathname = usePathname();
  useDraggableContactModal();

  const isHome = pathname === "/";
  const isArchive = pathname === "/archive";

  return (
    <div className="top">
      <Link href="/" style={{ borderBottom: "0px" }}>
        <div className="top-left">
          <table>
            <tbody>
              <tr>
                <td>
                  <div className="top-left-img" />
                </td>
                <td>
                  <div className="top-left-title">
                    <b>Gunmo's Dev Life</b>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Link>
      <div className="top-right">
        <table>
          <tbody>
            <tr>
              <td>
                <div className="top-contact" onClick={() => openContactModal(1)}>
                  Contact
                </div>
              </td>
              <td>
                <div className="top-right-home">
                  <Link style={isHome ? activeStyle : baseStyle} href="/">
                    Home
                  </Link>
                </div>
              </td>
              <td>
                <div className="top-right-archives">
                  <Link
                    style={{ ...(isArchive ? activeStyle : baseStyle), ...archiveLinkStyle }}
                    href="/archive"
                  >
                    Archive
                  </Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
