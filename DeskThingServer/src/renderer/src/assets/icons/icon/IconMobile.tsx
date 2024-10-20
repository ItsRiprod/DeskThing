import { Icon } from '.'

function IconMobile(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </svg>
    </Icon>
  )
}

export default IconMobile
