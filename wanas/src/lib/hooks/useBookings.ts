"use client";

import { useCallback, useEffect, useState } from "react";

const BOOKINGS_STORAGE_KEY = "wanas_bookings";

export interface BookingRecord {
  id: string;
  listingId: string;
  title: string;
  date: string;
  eventType?: string | null;
  timestamp: Date;
}

interface StoredBookingRecord extends Omit<BookingRecord, "timestamp"> {
  timestamp: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toBookingRecord(value: unknown): BookingRecord | null {
  if (!isObject(value)) return null;

  const id = value.id;
  const listingId = value.listingId;
  const title = value.title;
  const date = value.date;
  const eventType = value.eventType;
  const timestamp = value.timestamp;

  if (
    typeof id !== "string" ||
    typeof listingId !== "string" ||
    typeof title !== "string" ||
    typeof date !== "string" ||
    typeof timestamp !== "string"
  ) {
    return null;
  }

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  return {
    id,
    listingId,
    title,
    date,
    eventType: typeof eventType === "string" ? eventType : null,
    timestamp: parsedTimestamp,
  };
}

function parseStoredBookings(raw: string | null): BookingRecord[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => toBookingRecord(entry))
      .filter((entry): entry is BookingRecord => entry !== null);
  } catch {
    return [];
  }
}

function serializeBookings(bookings: BookingRecord[]): StoredBookingRecord[] {
  return bookings.map((booking) => ({
    ...booking,
    timestamp: booking.timestamp.toISOString(),
  }));
}

export function useBookings() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    setBookings(parseStoredBookings(raw));
  }, []);

  const removeBooking = useCallback((bookingId: string) => {
    setBookings((previous) => {
      const next = previous.filter((booking) => booking.id !== bookingId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          BOOKINGS_STORAGE_KEY,
          JSON.stringify(serializeBookings(next))
        );
      }

      return next;
    });
  }, []);

  return { bookings, removeBooking };
}
