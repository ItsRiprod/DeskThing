import { Icon, IconProps } from '.'

function IconStop(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 16 16" fill={props.fill || 'none'}>
        <path
          d="M3.28683 3.28634L12.7135 12.713M14.6668 7.99967C14.6668 11.6816 11.6821 14.6663 8.00016 14.6663C4.31826 14.6663 1.3335 11.6816 1.3335 7.99967C1.3335 4.31778 4.31826 1.33301 8.00016 1.33301C11.6821 1.33301 14.6668 4.31778 14.6668 7.99967Z"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  )
}

export default IconStop
