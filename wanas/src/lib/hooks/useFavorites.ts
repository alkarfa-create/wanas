"use client";

import { useState, useEffect } from "react";

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    // Load favorites from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("wanas_favorites");
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("wanas_favorites", JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (id: string) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
        );
    };

    const isFavorite = (id: string) => favorites.includes(id);

    return { favorites, toggleFavorite, isFavorite };
}
