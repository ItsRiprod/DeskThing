import { Icon } from '..'

function IconLogo(props): JSX.Element {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:v="http://vecta.io" viewBox="0 0 24 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-rule="evenodd"><style xmlns="http://www.w3.org/2000/svg">

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
}
</style>

    <g class="logo_text_asd" xmlns="http://www.w3.org/2000/svg">
    <g fill-rule="nonzero" stroke="none">
        <ellipse class="icon_dot_asd" cx="17.44" cy="3.1" rx="0.5" ry="0.5" fill="#1ed760"/>
        <text y="6.45" class="logo logo_text_slide_asd" font-size="3.52" fill="currentColor">D e s k T h i n g</text>
    </g>
</g>
</svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconLogo
