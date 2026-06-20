export type Sector = 'Finance' | 'IT' | 'Restaurants' | 'Real Estate' | 'Retail' | 'Healthcare';
export const SECTORS: Sector[] = ['Finance', 'IT', 'Restaurants', 'Real Estate', 'Retail', 'Healthcare'];

export const SECTOR_ICONS: Record<Sector, string> = {
  Finance: 'account_balance',
  IT: 'memory',
  Restaurants: 'restaurant',
  'Real Estate': 'apartment',
  Retail: 'storefront',
  Healthcare: 'local_hospital',
};

/** kebab-case slug used for CSS modifier classes, e.g. `sector-badge--real-estate`. */
export function sectorSlug(s: Sector): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

export const HOURS: string[] = (() => {
  const fmt = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${suffix}`;
  };
  const arr: string[] = [];
  for (let h = 8; h <= 20; h++) arr.push(fmt(h));
  return arr;
})();

export interface TimeSlot {
  id: string;
  /** ISO date (YYYY-MM-DD). Backend field: SlotDate. */
  date: string;
  start: string;     // e.g. "1PM"
  end: string;       // e.g. "2PM"
  booked: boolean;
}

export interface ConferenceRoom {
  id: string;
  name: string;
  floor?: number;
  slots: TimeSlot[];
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  rooms: ConferenceRoom[];
}

export interface SectorAvailability {
  sector: Sector;
  availableDate: string;
  start: string;
  end: string;
}

export interface Investor {
  id: string;
  name: string;
  mobile: string;
  availability: SectorAvailability[];
}

export interface Presenter {
  id: string;
  name: string;
  mobile: string;
  availability: SectorAvailability[];
}

export interface Reservation {
  id: string;
  slotId?: string;
  investorId: string;
  investorName: string;
  presenterId: string;
  presenterName: string;
  sector: Sector;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName: string;
  /** Backend field: SlotDate (YYYY-MM-DD). */
  slotDate: string;
  /** Display string e.g. "10AM–11AM". */
  timeSlot: string;
  status?: 'Confirmed' | 'Pending';
  bookedAt: string;      // ISO
}
