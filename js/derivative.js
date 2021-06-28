function positionOverflowingValueFrom(pos, data, maxsize) {
  if (pos < 0) {
    pos += maxsize;
  } else if (pos >= maxsize) {
    pos -= maxsize;
  }
  return data[pos];
}

function derivativeOf(data,maxsize,offset) {
  const result = []
  for (let i = 0; i < maxsize; i++) {
    const leftPos = positionOverflowingValueFrom(i, data, maxsize);
    const rightPos = positionOverflowingValueFrom(i + offset, data, maxsize);
    if (leftPos && rightPos) {
      result[i] = (rightPos - leftPos);
    }
  }
  return result;
}

export {derivativeOf, positionOverflowingValueFrom};
