import { Icon } from '.'

function IconPlus(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    </Icon>
  )
}

export default IconPlus
