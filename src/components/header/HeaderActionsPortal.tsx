"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function HeaderActionsPortal({ children }: { children: ReactNode }) {
    const [target, setTarget] = useState<Element | null>(null);

    useEffect(() => {
        setTarget(document.getElementById("header-actions"));
    }, []);

    if (!target) return null;
    return createPortal(children, target);
}
