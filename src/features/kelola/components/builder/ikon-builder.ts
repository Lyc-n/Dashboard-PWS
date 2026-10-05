/**
 * Peta ikon komponen Form Builder.
 *
 * Dipisah dari `BlockPalette` supaya `KontenDrag` (overlay yang mengikuti kursor
 * saat drag) memakai peta yang sama. Dua salinan peta ikon akan cepat diverge:
 * satu tempat sudah punya ikon baru, yang lain masih fallback ke `Type`.
 */
import {
  Type, AlignLeft, Hash, ChevronsDownUp, Circle, CheckSquare,
  Calendar, Clock, Image, File, Layout,
  User, Users, CreditCard, MapPin, Sparkles, GraduationCap,
  Briefcase, Heart, UserCheck, Hospital,
} from "lucide-react";

export type IkonKomponen = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * Kunci = nama ikon di katalog template (`TemplateField.ikon`) atau nama tipe
 * field (`PaletteItem.icon`).
 */
export const IKON_KOMPONEN: Record<string, IkonKomponen> = {
  // nama tipe field
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  select: ChevronsDownUp,
  radio: Circle,
  checkbox: CheckSquare,
  date: Calendar,
  time: Clock,
  image: Image,
  file: File,
  group: Layout,
  // ikon template siap pakai
  User,
  Users,
  CreditCard,
  MapPin,
  Sparkles,
  GraduationCap,
  Briefcase,
  Heart,
  UserCheck,
  Hospital,
};

/** Ikon untuk nama apa pun. Ikon tak dikenal jatuh ke ikon teks. */
export function ikonUntuk(nama: string | undefined): IkonKomponen {
  return (nama && IKON_KOMPONEN[nama]) || Type;
}