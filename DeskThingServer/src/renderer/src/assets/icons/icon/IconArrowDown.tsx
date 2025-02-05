import { Icon, IconProps } from '.'

function IconArrowDown(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Icon>
  )
}

export default IconArrowDown
