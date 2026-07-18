import s from './AvatarCluster.module.css'
import type { RemoteUser } from '@/types/garden'

interface Props {
  users: RemoteUser[]
}

export function AvatarCluster({ users }: Props) {
  return (
    <div className={s.root}>
      <div className={s.stack}>
        {users.slice(0, 4).map(u => (
          <div key={u.id} className={s.avatar} style={{ background: u.color }}>
            {u.initials}
          </div>
        ))}
      </div>
      <span className={s.count}>{users.length} active</span>
    </div>
  )
}
