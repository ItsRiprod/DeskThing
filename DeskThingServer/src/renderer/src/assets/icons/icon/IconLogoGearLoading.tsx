import { Icon } from '.'

function IconLogoGearLoading(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <style>
          {`.gear_alksdf {
    transform-origin: center;
    animation: gear_spinner1234 3s linear infinite;
  }
  
  .gear_alksdf path {
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
        stroke-dasharray: 43 0;
        stroke-dashoffset: 10;
      }
      40% {
        stroke-dasharray: 15 30;
        stroke-dashoffset: 56;
      }
      90%, 100% {
        stroke-dasharray: 43 0;
        stroke-dashoffset: 100;
      }
  }
  }
  `}
        </style>
        <g xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1ed760" strokeWidth=".5">
          <ellipse cx="12" cy="12" rx="5.955381" ry="5.89573" />
        </g>

        <g className="gear_alksdf">
          <path
            d="M12 1l-2-0-.5881 2.4687-1.4178.5863-2.1909-1.3578-2.9314 2.9616 1.4042 2.1169-.6114 1.4947-2.4904.4954.0148 4.021 2.4756.5571.6024 1.4171-1.3762 2.181 2.8697 2.8455 2.1255-1.3817 1.5092.5531.5245 2.5503h4.0579l.5585-2.5016 1.4572-.5953 2.1672 1.392 2.904-2.8374-1.4178-2.1662.6003-1.4442 2.5343-.5287v-4.0597l-2.5343-.4977-.5865-1.4456 1.3759-2.166-2.8646-2.9616-2.1293 1.3887-1.5122-.5864-.4877-2.4995-2-0"
            fill="none"
            strokeLinecap="butt"
          />
        </g>
      </svg>
    </Icon>
  )
}

export default IconLogoGearLoading
