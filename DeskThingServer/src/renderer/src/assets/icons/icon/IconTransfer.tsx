import { Icon } from '.'

function IconTransfer(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="m21 16-4 4-4-4" />
        <path d="M17 20V4" />
        <path d="m3 8 4-4 4 4" />
        <path d="M7 4v16" />
      </svg>
    </Icon>
  )
}

export default IconTransfer
