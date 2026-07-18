import s from './RttDisplay.module.css'

interface Props {
  rttMs: number
  budgetMs: number
}

export function RttDisplay({ rttMs, budgetMs }: Props) {
  const overBudget = rttMs > budgetMs

  return (
    <div className={s.root}>
      RTT{' '}
      <span className={overBudget ? s.warn : s.val}>{rttMs} ms</span>{' '}
      <span className={s.budget}>/ {budgetMs} ms budget</span>
    </div>
  )
}
