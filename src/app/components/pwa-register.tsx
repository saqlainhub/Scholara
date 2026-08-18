"use client";

import { useEffect } from "react";

export default function PWARegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) {
            return;
        }

        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                console.log(
                    "Scholara service worker registered:",
                    registration.scope
                );
            })
            .catch((error) => {
                console.error(
                    "Scholara service worker registration failed:",
                    error
                );
            });
    }, []);

    return null;
}