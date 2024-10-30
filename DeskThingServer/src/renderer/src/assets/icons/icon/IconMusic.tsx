import { Icon } from '.'

function IconMusic(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="18" r="4" />
        <path d="M12 18V2l7 4" />
      </svg>
    </Icon>
  )
}

export default IconMusic
