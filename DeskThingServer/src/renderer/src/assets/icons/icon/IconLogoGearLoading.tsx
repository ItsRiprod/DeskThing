import { Icon, IconProps } from '.'

function IconLogoGearLoading(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth={props.strokeWidth || '20'}
        viewBox="0 0 365.03 365.03"
      >
        <style>
          {`.cls-2 {
    transform-origin: center;
    animation: gear_spinner1234 3s linear infinite;
  }

  .cls-2 path {
    stroke-linecap: round;
    animation: gear_asdsd 2s ease-in-out infinite;
  }

  @keyframes gear_spinner1234 {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes gear_asdsd {
      0%  {
        stroke-dasharray: 700 1;
        stroke-dashoffset: 0;
      }
      40% {
        stroke-dasharray: 100 600;
        stroke-dashoffset: 300;
      }
      90%, 100% {
        stroke-dasharray: 700 1;
        stroke-dashoffset: 1300;
      }
  }
  }
      .cls-2 {
        stroke-miterlimit: 10;
        stroke-width: 20px;
      }
  `}
        </style>
        <defs>
          <style></style>
        </defs>
        <g id="Layer_1-2" data-name="Layer 1" className="">
          <ellipse
            className="cls-1"
            strokeWidth="15"
            stroke="#22c55e"
            cx="182.52"
            cy="182.52"
            rx="95.96"
            ry="94.99"
          />
          <g className="cls-2">
            <path d="M355.03,209.48v-53.94c0-3.3-2.32-6.15-5.55-6.82l-31.1-6.48c-2.26-.47-4.14-2.03-5.02-4.16l-6.91-16.67c-.88-2.13-.65-4.56.61-6.49l17.41-26.57c1.81-2.76,1.43-6.41-.9-8.75l-38.14-38.14c-2.33-2.33-5.99-2.71-8.75-.9l-26.57,17.41c-1.93,1.26-4.36,1.49-6.49.61l-16.67-6.91c-2.13-.88-3.69-2.76-4.16-5.02l-6.48-31.1c-.67-3.23-3.52-5.55-6.82-5.55h-53.94c-3.3,0-6.15,2.32-6.82,5.55l-6.48,31.1c-.47,2.26-2.03,4.14-4.16,5.02l-16.67,6.91c-2.13.88-4.56.65-6.49-.61l-26.57-17.41c-2.76-1.81-6.41-1.43-8.75.9l-38.14,38.14c-2.33,2.33-2.71,5.99-.9,8.75l17.41,26.57c1.26,1.93,1.49,4.36.61,6.49l-6.91,16.67c-.88,2.13-2.76,3.69-5.02,4.16l-31.1,6.48c-3.23.67-5.55,3.52-5.55,6.82v53.94c0,3.3,2.32,6.15,5.55,6.82l31.1,6.48c2.26.47,4.14,2.03,5.02,4.16l6.91,16.67c.88,2.13.65,4.56-.61,6.49l-17.41,26.57c-1.81,2.76-1.43,6.41.9,8.75l38.14,38.14c2.33,2.33,5.99,2.71,8.75.9l26.57-17.41c1.93-1.26,4.36-1.49,6.49-.61l16.67,6.91c2.13.88,3.69,2.76,4.16,5.02l6.48,31.1c.67,3.23,3.52,5.55,6.82,5.55h53.94c3.3,0,6.15-2.32,6.82-5.55l6.48-31.1c.47-2.26,2.03-4.14,4.16-5.02l16.67-6.91c2.13-.88,4.56-.65,6.49.61l26.57,17.41c2.76,1.81,6.41,1.43,8.75-.9l38.14-38.14c2.33-2.33,2.71-5.99.9-8.75l-17.41-26.57c-1.26-1.93-1.49-4.36-.61-6.49l6.91-16.67c.88-2.13,2.76-3.69,5.02-4.16l31.1-6.48c3.23-.67,5.55-3.52,5.55-6.82Z" />
          </g>
        </g>
      </svg>
    </Icon>
  )
}

export default IconLogoGearLoading
