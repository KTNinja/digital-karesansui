import s from './Logo.module.css'

export function Logo() {
  return (
    <div className={s.root}>
      <div className={s.stone} aria-hidden="true" />
      <span className={s.jp}>枯山水</span>
      <span className={s.sub}>Digital Karesansui</span>
    </div>
  )
}
