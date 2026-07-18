import s from './RoomChip.module.css'

interface Props {
  roomId: string
}

export function RoomChip({ roomId }: Props) {
  return (
    <div className={s.root}>
      Room:&nbsp;<strong className={s.id}>{roomId}</strong>
    </div>
  )
}
