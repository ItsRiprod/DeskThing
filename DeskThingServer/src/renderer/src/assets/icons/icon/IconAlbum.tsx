import { Icon } from '.'

function IconAlbum(props): JSX.Element {
  return (
    <Icon {...props}>
      <svg viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12z" />
        <path d="M12 10a2 2 0 100 4 2 2 0 000-4zm-4 2a4 4 0 118 0 4 4 0 01-8 0z" />
      </svg>
    </Icon>
  )
}

export default IconAlbum
