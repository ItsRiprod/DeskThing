export const Icon = ({
  iconSize = 24,
  color = "currentColor",
  title,
  titleId,
  desc,
  descId,
  className,
  width = iconSize,
  height = iconSize,
  dangerouslySetInnerHTML,
  ...restProps
}): JSX.Element => {
  return (
    <svg
      color={color}
      role="img"
      height={height}
      width={width}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      {...restProps}
    >
      {dangerouslySetInnerHTML ? (
        <g dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      ) : (
        <>
          {title && <title id={titleId}>{title}</title>}
          {desc && <desc id={descId}>{desc}</desc>}
        </>
      )}
    </svg>
  )
}
