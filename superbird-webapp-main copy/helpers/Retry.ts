interface WithSuccess {
  success: boolean;
}

export const tryActionNTimes = async <t extends WithSuccess>({
  asyncAction,
  n,
}: {
  asyncAction: () => Promise<t>;
  n: number;
}): Promise<t> => {
  let result;

  for (let i = 0; i < n; i++) {
    result = await asyncAction();
    if (result.success) {
      break;
    }
  }

  return result;
};
