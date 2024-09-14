import { Icon } from '.'

function IconLogo(props): JSX.Element {
  return (
    <Icon {...props}>
      {' '}
      <svg viewBox="0 0 24 7">
        {' '}
        <style>
          {`
  .logo_text_asd:hover ellipse {
    animation: asdl_dot_movement 1s ease-in-out 1;
  }

  @keyframes asdl_dot_movement {
      0%, 5%, 85%, 100% {
         transform: translate(0px, 0px);
    }
      15%, 75% {
         transform: translate(0px, -1px);
    }
  }`}
        </style>
        <g className="logo_text_asd" xmlns="http://www.w3.org/2000/svg">
          <g fillRule="nonzero" stroke="none">
            <ellipse
              className="icon_dot_asd"
              cx="17.44"
              cy="3.1"
              rx="0.5"
              ry="0.5"
              fill="#1ed760"
            />
            <text y="6.45" className="logo logo_text_slide_asd" fontSize="3.52" fill="currentColor">
              D e s k T h i n g
            </text>
          </g>
        </g>
      </svg>
    </Icon>
  )
}

export default IconLogo
