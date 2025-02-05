import { Icon, IconProps } from '.'

function Xs(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </Icon>
  )
}

export default Xs
