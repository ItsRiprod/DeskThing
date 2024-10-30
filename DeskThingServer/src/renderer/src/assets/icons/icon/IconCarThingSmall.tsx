import { Icon, IconProps } from '.'

function IconCarThingSmall(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        fill="none"
        strokeWidth={(props.strokeWidth || 1) * 2}
      >
        <path
          d="M42 28.2543C42 30.428 42 30.5462 42 33.2857C42 35.3371 40.2539 37 38.1 37H6.9C4.74609 37 3 35.3371 3 33.2857V14.7143C3 12.6629 4.74609 11 6.9 11H38.1C40.2539 11 42 12.6629 42 14.7143V16.5"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="39.5" cy="21.5" r="5.5" stroke="white" />
      </svg>
    </Icon>
  )
}

export default IconCarThingSmall
