import { Icon } from '..'

function IconLogoLoading(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 1.5

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:v="http://vecta.io" viewBox="0 0 24 48" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-rule="evenodd"><style xmlns="http://www.w3.org/2000/svg">
.gear {
  transform-origin: 11.5px 34.2px;
  animation: spinner_zKoa 4s ease-out infinite;
}

.gear path {
  stroke-linecap: round;
  animation: spinner_YpZS 4s ease-in-out infinite;
}

@keyframes spinner_zKoa {
  0%, 45% {
    transform: rotate(0deg);
  }
  65%, 100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner_YpZS {
    35%, 75%  {
      stroke-dasharray: 76 0;
      stroke-dashoffset: -5;
    }
    0%, 15%, 95%, 100% {
      stroke-dasharray: 66 5;
      stroke-dashoffset: -10;
  }
}

.screen {
    animation: movement 4s ease-in-out infinite;
}

@keyframes movement {
   0%, 35%, 75%, 100% {
      transform: translate(0px, 0px);
}
   45%, 65% {
      transform: translate(0px, -2px);
}
}
</style>

    <g xmlns="http://www.w3.org/2000/svg">
    <g class="screen" fill-rule="nonzero" stroke="none">
        <ellipse cx="16.74" cy="3.1" rx="0.5" ry="0.5" fill="#1ed760"/>
        <text x="-0.7" y="6.45" class="logo" font-size="3.52" fill="currentColor">D e s k T h i n g</text>
    </g>
    <g xmlns="http://www.w3.org/2000/svg" class="screen">
    <path d="M20.163212 11.000096h-4.3654v1.2437h2.1828l-2.8903 2.9213.8706.8697 2.9463-2.8714v2.1666h1.256zm-17.229039.054125h10.4666l-10.4666 10.2239z" stroke="#1ed760" fill="#1ed760" stroke-width=".5"/>
    <path d="M2.934173 16.895848h1.2261v1.2437h-1.2261zm0-2.893805h1.2261v1.2437h-1.2261zm0-2.920764h1.2261v1.2437h-1.2261zm2.97093 0h1.2261v1.2437h-1.2261z" stroke-width=".5" fill="currentColor"/>
    <path fill="none" stroke-linejoin="miter" d="M.045108 8.133358h22.894857v15.145028H.045108z" stroke-width="${strokeWidth}"/>

        </g>
<g xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1ed760" stroke-width=".5">
        <ellipse cx="11.533415" cy="34.150343" rx="5.955381" ry="5.89573"/>
    </g>


<g class="gear">
    <path d="M11.498488 23.490826l-2-0-.5881 2.4687-1.4178.5863-2.1909-1.3578-2.9314 2.9616 1.4042 2.1169-.6114 1.4947-2.4904.4954.0148 4.021 2.4756.5571.6024 1.4171-1.3762 2.181 2.8697 2.8455 2.1255-1.3817 1.5092.5531.5245 2.5503h4.0579l.5585-2.5016 1.4572-.5953 2.1672 1.392 2.904-2.8374-1.4178-2.1662.6003-1.4442 2.5343-.5287v-4.0597l-2.5343-.4977-.5865-1.4456 1.3759-2.166-2.8646-2.9616-2.1293 1.3887-1.5122-.5864-.4877-2.4995-2-0" fill="none" stroke-width="${strokeWidth}" stroke-linecap="butt"/>

</g>
</g>
</svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconLogoLoading


