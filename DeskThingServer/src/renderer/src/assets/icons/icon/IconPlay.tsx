import { Icon } from '.'

function IconPlay(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="${strokeWidth}"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    </Icon>
  )
}

export default IconPlay
