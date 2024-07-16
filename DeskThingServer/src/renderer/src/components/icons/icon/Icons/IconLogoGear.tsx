import { Icon } from '..'

function IconLogoGear(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 1.5

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:v="http://vecta.io" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-rule="evenodd">
<g xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1ed760" stroke-width=".5">
        <ellipse cx="12" cy="12" rx="5.955381" ry="5.89573"/>
    </g>


<g class="gear_alksdfj">
    <path d="M12 1l-2-0-.5881 2.4687-1.4178.5863-2.1909-1.3578-2.9314 2.9616 1.4042 2.1169-.6114 1.4947-2.4904.4954.0148 4.021 2.4756.5571.6024 1.4171-1.3762 2.181 2.8697 2.8455 2.1255-1.3817 1.5092.5531.5245 2.5503h4.0579l.5585-2.5016 1.4572-.5953 2.1672 1.392 2.904-2.8374-1.4178-2.1662.6003-1.4442 2.5343-.5287v-4.0597l-2.5343-.4977-.5865-1.4456 1.3759-2.166-2.8646-2.9616-2.1293 1.3887-1.5122-.5864-.4877-2.4995-2-0" fill="none" stroke-width="${strokeWidth}" stroke-linecap="butt"/>

</g>
</g>
</svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconLogoGear


