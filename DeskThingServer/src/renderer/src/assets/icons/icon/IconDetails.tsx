import { Icon } from '.'

function IconDetails(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="m3 10 2.5-2.5L3 5" />
        <path d="m3 19 2.5-2.5L3 14" />
        <path d="M10 6h11" />
        <path d="M10 12h11" />
        <path d="M10 18h11" />
      </svg>
    </Icon>
  )
}

export default IconDetails
