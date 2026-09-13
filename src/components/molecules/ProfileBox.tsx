import { Avatar } from "@/components/atoms/Avatar";

export interface ProfileBoxProps {
  name?: string;
  avatarSrc?: string;
}

export function ProfileBox({ name = "A. Jubaidi", avatarSrc = "https://i.pravatar.cc/100?img=12" }: ProfileBoxProps) {
  return (
    <div className="flex items-top gap-2.5">
      <span className="text-[13px] font-semibold text-ink">{name}</span>
      <Avatar src={avatarSrc} size="sm" />
    </div>
  );
}

export default ProfileBox;