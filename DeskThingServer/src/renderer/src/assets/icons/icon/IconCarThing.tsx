import { Icon, IconProps } from '.'

interface CarThingProps extends IconProps {
  highlighted?: string[]
  highlightColor?: string
  fontSize?: number
  text?: string
  onPress?: (key: string) => void
}

function IconCarThing({
  highlighted = [],
  highlightColor = '',
  onPress,
  ...props
}: CarThingProps): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="15.55 10.22 1174.89 624.25">
        <g>
          <path
            d="M1133.67,362.04l0,228.55c0,19.764 -16.045,35.81 -35.809,35.81l-1038.42,-0c-19.764,-0 -35.81,-16.046 -35.81,-35.81l0,-532.63c0,-19.764 16.046,-35.809 35.81,-35.809l1038.42,-0c19.764,-0 35.809,16.045 35.809,35.809l0,68.938c30.092,30.108 48.713,71.682 48.713,117.571c0,45.889 -18.621,87.463 -48.713,117.571Zm-12.437,-246.399l0,-57.681c0,-12.899 -10.473,-23.372 -23.372,-23.372l-1038.42,0c-12.9,0 -23.372,10.473 -23.372,23.372l-0,532.63c-0,12.9 10.472,23.372 23.372,23.372l1038.42,0c12.899,0 23.372,-10.472 23.372,-23.372l0,-217.294c-28.673,23.449 -65.306,37.523 -105.199,37.523c-41.381,-0 -79.254,-15.143 -108.373,-40.184l-0,175.773c-0,17.046 -13.84,30.886 -30.886,30.886l-776.705,-0c-17.047,-0 -30.886,-13.84 -30.886,-30.886l-0,-444.004c-0,-17.047 13.839,-30.886 30.886,-30.886l776.705,-0c17.046,-0 30.886,13.839 30.886,30.886l-0,15.899c29.119,-25.042 66.992,-40.184 108.373,-40.184c39.893,-0 76.526,14.073 105.199,37.522Zm-226.01,243.136c-28.222,-29.815 -45.539,-70.055 -45.539,-114.308c-0,-44.253 17.317,-84.494 45.539,-114.309l0,-27.756c0,-10.182 -8.266,-18.449 -18.448,-18.449l-776.705,0c-10.182,0 -18.449,8.267 -18.449,18.449l0,444.004c0,10.182 8.267,18.448 18.449,18.448l776.705,0c10.182,0 18.448,-8.266 18.448,-18.448l0,-187.631Zm120.811,-268.221c-84.947,0 -153.913,68.966 -153.913,153.913c0,84.946 68.966,153.912 153.913,153.912c84.946,0 153.912,-68.966 153.912,-153.912c0,-84.947 -68.966,-153.913 -153.912,-153.913Zm-0,362.757c29.745,-0 53.895"
            stroke="currentColor"
            fill="currentColor"
          />
          <path
            onClick={() => onPress?.('Digit4')}
            className={`${onPress && 'cursor-pointer'}`}
            d="M847.616,14.189l-0,4.664c-0,1.287 -1.045,2.332 -2.332,2.332l-83.434,-0c-1.287,-0 -2.332,-1.045 -2.332,-2.332l-0,-4.664c-0,-1.287 1.045,-2.332 2.332,-2.332l83.434,-0c1.287,-0 2.332,1.045 2.332,2.332Z"
            fill={highlighted.includes('Digit4') ? highlightColor : 'currentColor'}
            stroke={highlighted.includes('Digit4') ? highlightColor : 'currentColor'}
          />
          <path
            onClick={() => onPress?.('Digit3')}
            className={`${onPress && 'cursor-pointer'}`}
            d="M637.217,14.189l0,4.664c0,1.287 -1.045,2.332 -2.332,2.332l-83.434,-0c-1.287,-0 -2.332,-1.045 -2.332,-2.332l0,-4.664c0,-1.287 1.045,-2.332 2.332,-2.332l83.434,-0c1.287,-0 2.332,1.045 2.332,2.332Z"
            fill={highlighted.includes('Digit3') ? highlightColor : 'currentColor'}
            stroke={highlighted.includes('Digit3') ? highlightColor : 'currentColor'}
          />
          <path
            onClick={() => onPress?.('Digit2')}
            className={`${onPress && 'cursor-pointer'}`}
            d="M429.928,14.189l-0,4.664c-0,1.287 -1.045,2.332 -2.332,2.332l-83.434,-0c-1.287,-0 -2.332,-1.045 -2.332,-2.332l-0,-4.664c-0,-1.287 1.045,-2.332 2.332,-2.332l83.434,-0c1.287,-0 2.332,1.045 2.332,2.332Z"
            fill={highlighted.includes('Digit2') ? highlightColor : 'currentColor'}
            stroke={highlighted.includes('Digit2') ? highlightColor : 'currentColor'}
          />
          <path
            onClick={() => onPress?.('Digit1')}
            className={`${onPress && 'cursor-pointer'}`}
            d="M223.675,14.189l-0,4.664c-0,1.287 -1.045,2.332 -2.332,2.332l-83.434,-0c-1.287,-0 -2.332,-1.045 -2.332,-2.332l-0,-4.664c-0,-1.287 1.045,-2.332 2.332,-2.332l83.434,-0c1.287,-0 2.332,1.045 2.332,2.332Z"
            fill={highlighted.includes('Digit1') ? highlightColor : 'currentColor'}
            stroke={highlighted.includes('Digit1') ? highlightColor : 'currentColor'}
          />
          <path
            onClick={() => onPress?.('Enter')}
            className={`${onPress && 'cursor-pointer'}`}
            d="M1015.48,90.38c-84.947,0 -153.913,68.966 -153.913,153.913c0,84.946 68.966,153.912 153.913,153.912c84.946,0 153.912,-68.966 153.912,-153.912c0,-84.947 -68.966,-153.913 -153.912,-153.913Z"
            fill={highlighted.includes('Enter') ? highlightColor : 'none'}
            stroke={
              highlighted.includes('Scroll') || highlighted.includes('Enter')
                ? highlightColor
                : 'currentColor'
            }
          />
          <circle
            onClick={() => onPress?.('Escape')}
            className={`${onPress && 'cursor-pointer'}`}
            cx="1015.48"
            cy="500.137"
            r="41.458"
            fill={highlighted.includes('Escape') ? highlightColor : 'currentColor'}
            stroke={highlighted.includes('Escape') ? highlightColor : 'currentColor'}
          />

          <text
            x="480"
            y={props.fontSize ? props.fontSize * 0.2 + 350 : 350}
            fill="white"
            fontSize={props.fontSize || 100}
            textAnchor="middle"
          >
            {props.text || ''}
          </text>
        </g>
      </svg>
    </Icon>
  )
}

export default IconCarThing
