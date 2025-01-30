import { Icon, IconProps } from '.'

function IconPlay(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    </Icon>
  )
}

export default IconPlay
