import { Icon } from '.'

function IconTrash(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 17 16" fill="none">
        <g clipPath="url(#clip0_268_267)">
          <path
            d="M2.16699 3.99967H3.50033M3.50033 3.99967H14.167M3.50033 3.99967V13.333C3.50033 13.6866 3.6408 14.0258 3.89085 14.2758C4.1409 14.5259 4.48004 14.6663 4.83366 14.6663H11.5003C11.8539 14.6663 12.1931 14.5259 12.4431 14.2758C12.6932 14.0258 12.8337 13.6866 12.8337 13.333V3.99967M5.50033 3.99967V2.66634C5.50033 2.31272 5.6408 1.97358 5.89085 1.72353C6.1409 1.47348 6.48004 1.33301 6.83366 1.33301H9.50033C9.85395 1.33301 10.1931 1.47348 10.4431 1.72353C10.6932 1.97358 10.8337 2.31272 10.8337 2.66634V3.99967M6.83366 7.33301V11.333M9.50033 7.33301V11.333"
            stroke={'currentColor'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_268_267">
            <rect width="16" height="16" fill="currentColor" transform="translate(0.166992)" />
          </clipPath>
        </defs>
      </svg>
    </Icon>
  )
}

export default IconTrash
