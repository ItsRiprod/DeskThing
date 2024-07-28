import { Icon, findClosestGlyphAvailable } from '..'

function IconMicDiscord(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M4 4a4 4 0 118 0v3a4 4 0 01-8 0V4zm4-2.5A2.5 2.5 0 005.5 4v3a2.5 2.5 0 005 0V4A2.5 2.5 0 008 1.5z\'/><path d=\'M2.25 6v1a5.75 5.75 0 0011.5 0V6h1.5v1a7.251 7.251 0 01-6.5 7.212V16h-1.5v-1.788A7.251 7.251 0 01.75 7V6h1.5z\'/>'
  }, {
    'size': 24,
    'svgContent': '<g opacity="1" transform="matrix(1,0,0,1,12,8.5)"><path fill-opacity="1" d=" M-4,-1.3799999952316284 C-4,-3.5889999866485596 -2.2090001106262207,-5.380000114440918 0,-5.380000114440918 C2.2090001106262207,-5.380000114440918 4,-3.5889999866485596 4,-1.3799999952316284 C4,-1.3799999952316284 4,2.509999990463257 4,2.509999990463257 C4,4.718999862670898 2.2090001106262207,6.5 0,6.5 C-2.2090001106262207,6.5 -4,4.718999862670898 -4,2.509999990463257 C-4,2.509999990463257 -4,-1.3799999952316284 -4,-1.3799999952316284z"></path></g><g opacity="1" transform="matrix(1,0,0,1,12,14)"><path stroke-linecap="round" stroke-linejoin="miter" fill-opacity="0" stroke-miterlimit="4" stroke-opacity="1" stroke-width="2" d=" M-7,-2.990000009536743 C-7,0.8759999871253967 -3.865999937057495,4.010000228881836 0,4.010000228881836 C3.865999937057495,4.010000228881836 7,0.8759999871253967 7,-2.990000009536743"></path></g><g opacity="1" transform="matrix(1,0,0,1,12,20)"><path fill-opacity="1" d=" M-1,-2 C-1,-2.2760000228881836 -0.7760000228881836,-2.5 -0.5,-2.5 C-0.5,-2.5 0.5,-2.5 0.5,-2.5 C0.7760000228881836,-2.5 1,-2.2760000228881836 1,-2 C1,-2 1,2 1,2 C1,2.2760000228881836 0.7760000228881836,2.5 0.5,2.5 C0.5,2.5 -0.5,2.5 -0.5,2.5 C-0.7760000228881836,2.5 -1,2.2760000228881836 -1,2 C-1,2 -1,-2 -1,-2z"></path></g><g opacity="1" transform="matrix(1,0,0,1,12,22)"><path fill-opacity="1" d=" M3,-1 C3.552000045776367,-1 4,-0.5519999861717224 4,0 C4,0.5519999861717224 3.552000045776367,1 3,1 C3,1 -3,1 -3,1 C-3.552000045776367,1 -4,0.5519999861717224 -4,0 C-4,-0.5519999861717224 -3.552000045776367,-1 -3,-1 C-3,-1 3,-1 3,-1z"></path></g>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconMicDiscord
