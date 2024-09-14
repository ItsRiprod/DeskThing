import { Icon } from '.'

function IconArrowRight(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Icon>
  )
}

export default IconArrowRight
