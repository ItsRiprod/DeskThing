import { Icon } from '.'

function IconLayoutgrid(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    </Icon>
  )
}

export default IconLayoutgrid
