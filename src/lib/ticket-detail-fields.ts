import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bookmark,
  Building2,
  FileText,
  Folder,
  Hash,
  LayoutGrid,
  User,
  Users,
} from "lucide-react";

export const TICKET_DETAIL_VISIBLE_FIELD_ORDER = [
  "18066",
  "15834",
  "9",
  "2882",
  "66",
  "13",
  "2873",
  "399",
  "2",
] as const;

export type TicketDetailVisibleFieldKey =
  (typeof TICKET_DETAIL_VISIBLE_FIELD_ORDER)[number];

export type TicketDetailFieldSelection = {
  id: string;
  fieldKey: string;
  label: string;
  value: string;
};

export type TicketDetailFieldIconConfig = {
  icon: LucideIcon;
  containerClassName: string;
  iconClassName: string;
};

export const TICKET_DETAIL_FIELD_LABELS: Record<
  TicketDetailVisibleFieldKey,
  string
> = {
  "18066": "Daftar Aplikasi Layanan Konsultasi TIK DJPb",
  "15834": "Unit Asal",
  "9": "Kode Satker",
  "2882": "Kategori Layanan",
  "66": "Unit Eselon I Terkait",
  "13": "Topik Permasalahan",
  "2873": "Jenis Stakeholder",
  "399": "Detail Topik",
  "2": "Asal Unit/Individu/Masyarakat",
};

export const TICKET_DETAIL_FIELD_ICONS: Record<
  TicketDetailVisibleFieldKey,
  TicketDetailFieldIconConfig
> = {
  "18066": {
    icon: Folder,
    containerClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
  },
  "15834": {
    icon: Bookmark,
    containerClassName: "bg-amber-100",
    iconClassName: "text-amber-600",
  },
  "9": {
    icon: Hash,
    containerClassName: "bg-blue-100",
    iconClassName: "text-blue-600",
  },
  "2882": {
    icon: LayoutGrid,
    containerClassName: "bg-purple-100",
    iconClassName: "text-purple-600",
  },
  "66": {
    icon: Building2,
    containerClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
  },
  "13": {
    icon: AlertTriangle,
    containerClassName: "bg-red-100",
    iconClassName: "text-red-600",
  },
  "2873": {
    icon: Users,
    containerClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
  },
  "399": {
    icon: FileText,
    containerClassName: "bg-blue-100",
    iconClassName: "text-blue-600",
  },
  "2": {
    icon: User,
    containerClassName: "bg-orange-100",
    iconClassName: "text-orange-600",
  },
};

const VISIBLE_FIELD_ORDER = new Map<string, number>(
  TICKET_DETAIL_VISIBLE_FIELD_ORDER.map((fieldKey, index) => [fieldKey, index]),
);

export function getTicketDetailFieldIcon(
  fieldKey: string,
): TicketDetailFieldIconConfig {
  return (
    TICKET_DETAIL_FIELD_ICONS[fieldKey as TicketDetailVisibleFieldKey] ?? {
      icon: FileText,
      containerClassName: "bg-surface-muted",
      iconClassName: "text-muted",
    }
  );
}

export function extractTicketFieldNumericId(fullId: string): string | null {
  const segments = fullId.split(".");
  if (segments.length < 2) {
    return null;
  }

  const prefix = segments[0];
  if (prefix !== "ticketfield" && prefix !== "organizationfield") {
    return null;
  }

  return segments[1] ?? null;
}

export function getTicketDetailFieldLabel(fieldKey: string): string {
  return (
    TICKET_DETAIL_FIELD_LABELS[
      fieldKey as TicketDetailVisibleFieldKey
    ] ?? fieldKey
  );
}

function isTicketFieldId(fullId: string): boolean {
  return fullId.startsWith("ticketfield.");
}

export function selectVisibleTicketDetailFields(
  allFields: TicketDetailFieldSelection[],
): TicketDetailFieldSelection[] {
  const selectedByKey = new Map<string, TicketDetailFieldSelection>();

  for (const field of allFields) {
    const fieldKey = field.fieldKey;
    if (!VISIBLE_FIELD_ORDER.has(fieldKey)) {
      continue;
    }

    const existing = selectedByKey.get(fieldKey);
    if (!existing) {
      selectedByKey.set(fieldKey, field);
      continue;
    }

    if (isTicketFieldId(field.id) && !isTicketFieldId(existing.id)) {
      selectedByKey.set(fieldKey, field);
    }
  }

  return TICKET_DETAIL_VISIBLE_FIELD_ORDER.flatMap((fieldKey) => {
    const field = selectedByKey.get(fieldKey);
    return field ? [field] : [];
  });
}
