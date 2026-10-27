import { ROOM_STATUS_COLORS, type RoomStatus } from '../models/curriculum.model';

export function studyRoomStatusBadge(status: RoomStatus) {
  const styles = ROOM_STATUS_COLORS[status];
  return {
    label: styles.label,
    customBg: styles.bg,
    customText: styles.text,
    customBorder: styles.border,
  };
}
