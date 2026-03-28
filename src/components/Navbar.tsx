"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";
import "./Navbar.css";

export function Navbar() {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAdmin = user?.publicMetadata?.role === "admin";
    const isActive = (href: string) => pathname === href;

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link href="/">
                    <span className="navbar-logo-label">lymph drainage</span>
                    <span className="navbar-logo-name">tetote</span>
                </Link>
            </div>
            <div className={`navbar-toggle ${isMenuOpen ? "open" : ""}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <span></span><span></span><span></span>
            </div>
            <ul className={`navbar-links ${isMenuOpen ? "open" : ""}`}>
                <li className={isActive("/") ? "active" : ""}>
                    <Link href="/" onClick={closeMenu}>HOME</Link>
                </li>
                <li className={isActive("/booking") ? "active" : ""}>
                    <Link href="/booking" onClick={closeMenu}>RESERVE</Link>
                </li>
                {isSignedIn && (
                    <li className={isActive("/mypage") ? "active" : ""}>
                        <Link href="/mypage" onClick={closeMenu}>MY PAGE</Link>
                    </li>
                )}
                {isSignedIn && isAdmin && (
                    <li className={isActive("/admin/availability") ? "active" : ""}>
                        <Link href="/admin/availability" onClick={closeMenu}>ADMIN</Link>
                    </li>
                )}
                <li className="navbar-auth">
                    {isSignedIn ? (
                        <SignOutButton>
                            <button className="btn-outline" onClick={closeMenu}>SIGN OUT</button>
                        </SignOutButton>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="btn-outline" onClick={closeMenu}>SIGN IN</button>
                        </SignInButton>
                    )}
                </li>
            </ul>
        </nav>
    );
}
