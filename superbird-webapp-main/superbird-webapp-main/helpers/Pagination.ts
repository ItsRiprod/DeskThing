export const shouldFetchMore = (
  minDistanceFromEnd: number,
  currentLength: number,
  currentIndex: number,
  totalAvailable: number,
): boolean => {
  return (
    currentLength - currentIndex < minDistanceFromEnd &&
    currentLength < totalAvailable
  );
};

export const getNextOffset = (
  currentOffset: number,
  pageSize: number,
  totalAvailable: number,
): number => {
  return Math.min(currentOffset + pageSize, totalAvailable);
};

export const getNextLimit = (pageSize, currentNumberOfItems, totalAvailable) =>
  pageSize + currentNumberOfItems >= totalAvailable
    ? totalAvailable - currentNumberOfItems
    : pageSize;
